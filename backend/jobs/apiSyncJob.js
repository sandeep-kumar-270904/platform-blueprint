const axios = require('axios');
const ScholarshipDataSource = require('../models/ScholarshipDataSource');
const Scholarship = require('../models/Scholarship');
const mongoose = require('mongoose');

// Helper to access nested properties by string path, e.g. "data.scholarship.name"
const getNestedProperty = (obj, path) => {
    if (!path) return null;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const runApiSync = async () => {
    console.log('[API Sync] Starting scholarship sync...');
    const sources = await ScholarshipDataSource.find({ isActive: true });
    
    for (const source of sources) {
        console.log(`[API Sync] Processing source: ${source.name}`);
        try {
            const config = {};
            if (source.authMethod === 'bearer' && source.credentials) {
                config.headers = { Authorization: `Bearer ${source.credentials}` };
            } else if (source.authMethod === 'api_key' && source.credentials) {
                config.headers = { 'x-api-key': source.credentials };
            }

            const response = await axios.get(source.apiEndpoint, config);
            const data = response.data;
            
            // Assume the API returns an array at some root level or just an array
            let items = [];
            if (Array.isArray(data)) {
                items = data;
            } else if (data.data && Array.isArray(data.data)) {
                items = data.data;
            } else {
                throw new Error('Unsupported response format: could not find an array of items');
            }
            
            let successCount = 0;
            let errorCount = 0;

            for (const item of items) {
                try {
                    // Extract fields based on fieldMapping
                    const title = getNestedProperty(item, source.fieldMapping.title) || 'Untitled';
                    const provider = getNestedProperty(item, source.fieldMapping.provider) || source.name;
                    const description = getNestedProperty(item, source.fieldMapping.description) || '';
                    const amountRaw = getNestedProperty(item, source.fieldMapping.amount);
                    const amount = parseFloat(amountRaw) || 0;
                    const applicationDeadlineRaw = getNestedProperty(item, source.fieldMapping.applicationDeadline);
                    const sourceUrl = getNestedProperty(item, source.fieldMapping.sourceUrl);

                    const existing = await Scholarship.findOne({ title, provider, source: 'api_sync' });
                    
                    const updateData = {
                        title,
                        provider,
                        description,
                        amount: amount > 0 ? { min: amount, max: amount } : undefined,
                        amountType: amount > 0 ? 'fixed' : 'varies',
                        applicationDeadline: applicationDeadlineRaw ? new Date(applicationDeadlineRaw) : new Date(Date.now() + 30*24*60*60*1000), // default 30 days if missing
                        applicationMode: 'external_link',
                        externalUrl: sourceUrl || source.apiEndpoint, 
                        sourceUrl: sourceUrl || source.apiEndpoint,
                        source: 'api_sync',
                        providerVerification: {
                            isVerified: true,
                            source: 'institution_partnership' // Trusting configured APIs
                        },
                        status: 'published'
                    };

                    if (existing) {
                        await Scholarship.findByIdAndUpdate(existing._id, updateData);
                    } else {
                        await Scholarship.create(updateData);
                    }
                    successCount++;
                } catch (err) {
                    console.error(`[API Sync] Error mapping item from ${source.name}:`, err.message);
                    errorCount++;
                }
            }

            source.lastSyncedAt = new Date();
            source.lastSyncStatus = errorCount > 0 ? (successCount > 0 ? 'partial' : 'failed') : 'success';
            await source.save();

            console.log(`[API Sync] Completed source ${source.name}. Success: ${successCount}, Errors: ${errorCount}`);

        } catch (error) {
            console.error(`[API Sync] Failed to process source ${source.name}:`, error.message);
            source.lastSyncedAt = new Date();
            source.lastSyncStatus = 'failed';
            await source.save();
        }
    }
};

module.exports = { runApiSync };

exports.apiSyncJob = () => { /* sync */ };
