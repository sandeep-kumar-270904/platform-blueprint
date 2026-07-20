const ScholarshipDataSource = require('../models/ScholarshipDataSource');
const Scholarship = require('../models/Scholarship');
const axios = require('axios');

exports.runApiSync = async (dataSourceId = null) => {
  let query = { isActive: true };
  if (dataSourceId) query._id = dataSourceId;
  
  const sources = await ScholarshipDataSource.find(query);

  for (const source of sources) {
    try {
      // In a real system we would use credentialsRef to get auth keys
      const headers = {};
      if (source.authMethod === 'api_key') {
        // Mocking credential retrieval
        headers['Authorization'] = `Bearer mock-key`;
      }

      const response = await axios.get(source.apiEndpoint, { headers });
      const dataList = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      let successCount = 0;
      let failedCount = 0;
      let errorDetails = [];

      for (const item of dataList) {
        try {
          // Dynamic mapping based on fieldMapping
          const title = item[source.fieldMapping.title || 'title'];
          const description = item[source.fieldMapping.description || 'description'];
          const url = item[source.fieldMapping.url || 'url'];
          
          if (!title || !url) {
            throw new Error(`Missing required fields in item: ${JSON.stringify(item)}`);
          }

          // Upsert logic based on title (or ideally an external ID)
          await Scholarship.findOneAndUpdate(
            { title, source: 'api_sync', dataSourceId: source._id },
            {
              title,
              description,
              originalSourceUrl: url,
              dataSourceId: source._id,
              source: 'api_sync',
              status: 'published',
              providerVerification: 'verified_institution' // configurable in future
            },
            { upsert: true, new: true }
          );
          successCount++;
        } catch (itemErr) {
          failedCount++;
          errorDetails.push(itemErr.message);
        }
      }

      source.lastSyncedAt = new Date();
      if (failedCount === 0 && successCount > 0) {
        source.lastSyncStatus = 'success';
        source.lastSyncErrorDetail = null;
      } else if (successCount > 0 && failedCount > 0) {
        source.lastSyncStatus = 'partial';
        source.lastSyncErrorDetail = `Partial failure. Failed: ${failedCount}. Details: ${errorDetails.slice(0, 5).join(' | ')}`;
      } else {
        source.lastSyncStatus = 'failed';
        source.lastSyncErrorDetail = `Failed all. Details: ${errorDetails.slice(0, 5).join(' | ')}`;
      }

      await source.save();

    } catch (err) {
      source.lastSyncedAt = new Date();
      source.lastSyncStatus = 'failed';
      source.lastSyncErrorDetail = `Network/API error: ${err.message}`;
      await source.save();
    }
  }
};

exports.flagStaleDataSources = async () => {
  try {
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - 7); // configurable threshold, e.g., 7 days

    const staleSources = await ScholarshipDataSource.find({
      isActive: true,
      lastSyncedAt: { $lt: staleThreshold }
    });

    for (const source of staleSources) {
      await Scholarship.updateMany(
        { dataSourceId: source._id },
        { $set: { needsReview: true } }
      );
    }
  } catch (err) {
    console.error('Error flagging stale data sources:', err);
  }
};
