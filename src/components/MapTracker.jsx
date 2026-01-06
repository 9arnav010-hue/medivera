// backend/src/controllers/runController.js - UPDATED createRun function
export const createRun = async (req, res) => {
  try {
    const { 
      distance, 
      duration, 
      pace, 
      calories, 
      route, 
      startLocation,
      endLocation,
      avgHeartRate,
      maxHeartRate,
      elevationGain
    } = req.body;
    
    const userId = req.user.id;

    console.log('Received run data:', {
      distance, duration, route: route?.type,
      startLocation: startLocation?.coordinates,
      endLocation: endLocation?.coordinates
    });

    // Validate required fields
    if (!distance || !duration || !route || !route.coordinates) {
      return res.status(400).json({ 
        message: 'Missing required fields: distance, duration, and route coordinates' 
      });
    }

    // CRITICAL FIX: Ensure coordinates are properly formatted
    const formatCoordinates = (coords) => {
      // If it's already a flat array of 2 numbers, return as is
      if (Array.isArray(coords) && coords.length === 2 && 
          typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        return coords;
      }
      
      // If it's nested, extract the inner array
      if (Array.isArray(coords) && Array.isArray(coords[0])) {
        // Handle [[lng, lat]] case
        return coords[0].length === 2 ? coords[0] : coords;
      }
      
      // If we can't determine, use default
      return [0, 0];
    };

    // Format route coordinates
    const routeCoordinates = route.coordinates.map(coord => {
      const formatted = formatCoordinates(coord);
      return [
        parseFloat(formatted[0].toFixed(7)),
        parseFloat(formatted[1].toFixed(7))
      ];
    });

    // Format start and end locations
    const formattedStart = formatCoordinates(startLocation?.coordinates || routeCoordinates[0]);
    const formattedEnd = formatCoordinates(endLocation?.coordinates || routeCoordinates[routeCoordinates.length - 1]);

    console.log('Formatted coordinates:', {
      start: formattedStart,
      end: formattedEnd,
      routeLength: routeCoordinates.length
    });

    // Calculate pace if not provided
    const calculatedPace = pace || (duration / distance);

    const run = new Run({
      userId,
      distance: parseFloat(distance),
      duration: parseFloat(duration),
      pace: calculatedPace,
      calories: calories || Math.round(distance * 60),
      route: {
        type: 'LineString',
        coordinates: routeCoordinates
      },
      startLocation: {
        type: 'Point',
        coordinates: [
          parseFloat(formattedStart[0].toFixed(7)),
          parseFloat(formattedStart[1].toFixed(7))
        ]
      },
      endLocation: {
        type: 'Point',
        coordinates: [
          parseFloat(formattedEnd[0].toFixed(7)),
          parseFloat(formattedEnd[1].toFixed(7))
        ]
      },
      avgHeartRate,
      maxHeartRate,
      elevationGain: elevationGain || 0,
      weather: req.body.weather || {}
    });

    await run.save();

    // Update user statistics
    const user = await User.findById(userId);
    user.totalDistance = (user.totalDistance || 0) + parseFloat(distance);
    user.totalRuns = (user.totalRuns || 0) + 1;
    user.totalDuration = (user.totalDuration || 0) + parseFloat(duration);
    user.totalCalories = (user.totalCalories || 0) + (calories || Math.round(distance * 60));
    
    // Update points
    const pointsEarned = Math.round(distance * 10);
    user.points = (user.points || 0) + pointsEarned;
    
    await user.save();

    // Update team stats if user is in a team
    const userTeam = await Team.findOne({ 'members.user': userId });
    if (userTeam) {
      const memberIndex = userTeam.members.findIndex(
        m => m.user.toString() === userId.toString()
      );
      
      if (memberIndex !== -1) {
        userTeam.members[memberIndex].contribution.distance += parseFloat(distance);
        userTeam.members[memberIndex].contribution.runs += 1;
        userTeam.members[memberIndex].contribution.points += pointsEarned;
        
        userTeam.totalDistance += parseFloat(distance);
        userTeam.totalRuns += 1;
        userTeam.totalPoints += pointsEarned;
        
        await userTeam.save();
      }
    }

    res.status(201).json({
      message: 'Run created successfully',
      run,
      pointsEarned,
      stats: {
        totalDistance: user.totalDistance,
        totalRuns: user.totalRuns,
        totalPoints: user.points
      }
    });
  } catch (error) {
    console.error('Create run error:', error);
    
    // Special handling for GeoJSON errors
    if (error.message.includes('geo keys') || error.message.includes('Point')) {
      return res.status(400).json({ 
        message: 'GeoJSON format error. Please check coordinate format.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};
