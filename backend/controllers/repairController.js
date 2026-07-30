const RepairProvider = require('../models/RepairProvider');

// Helper to calculate if open now based on operating hours
const calculateAvailability = (provider) => {
  if (provider.manualStatusOverride) {
    return provider.manualStatusOverride;
  }
  
  if (!provider.operatingHours || provider.operatingHours.length === 0) {
    return "Usually responds within 2 hours"; // Fallback
  }

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayStr = days[now.getDay()];
  
  const todaySchedule = provider.operatingHours.find(h => h.day === currentDayStr);
  
  if (!todaySchedule || !todaySchedule.isOpen) {
    return "Closed";
  }

  // Parse HH:mm to check if current time is within bounds
  const [openHour, openMin] = todaySchedule.openTime.split(':').map(Number);
  const [closeHour, closeMin] = todaySchedule.closeTime.split(':').map(Number);
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  if (currentTime >= openTime && currentTime <= closeTime) {
    return "Open now";
  }
  
  return "Closed";
};

// @desc    Get repair service providers
// @route   GET /api/repair
// @access  Public
exports.getProviders = async (req, res) => {
  try {
    const { category, sort, page = 1, limit = 6, lat, lng } = req.query;

    let query = {};
    
    // Filtering
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    let queryObj = RepairProvider.find(query);

    // Sorting
    let sortObj = {};
    if (sort === 'top_rated') {
      sortObj.rating = -1;
      queryObj = queryObj.sort(sortObj);
    } else if (sort === 'price_low') {
      sortObj.basePrice = 1;
      queryObj = queryObj.sort(sortObj);
    } else if (sort === 'nearest' && lat && lng) {
      // If coordinates are provided, use $near aggregation instead of standard find()
      // Fallback to find() if invalid coords
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        // Rewrite query to use $near
        query = {
          ...query,
          "location.coordinates": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
              }
            }
          }
        };
        queryObj = RepairProvider.find(query);
      } else {
        // Fallback if bad coords
        sortObj.rating = -1;
        queryObj = queryObj.sort(sortObj);
      }
    } else {
      // Default fallback sort (e.g. if 'nearest' requested but no coords provided)
      sortObj.rating = -1;
      queryObj = queryObj.sort(sortObj);
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 6;
    const skip = (pageNum - 1) * limitNum;

    queryObj = queryObj.skip(skip).limit(limitNum);

    // Execution
    const providers = await queryObj;
    
    // Map to include computed availability
    const mappedProviders = providers.map(p => {
      const pObj = p.toObject();
      pObj.availability = calculateAvailability(pObj);
      
      // format location coords nicely if needed, or hide them
      pObj.id = pObj._id; // ensure frontend standard id maps
      return pObj;
    });

    // Count for pagination
    const total = await RepairProvider.countDocuments(query);

    res.status(200).json({
      success: true,
      count: mappedProviders.length,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: mappedProviders
    });
  } catch (error) {
    console.error('Error fetching repair providers:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
