import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Switch } from './components/ui/switch';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ComposedChart, Bar, Line } from 'recharts';

// Simulated ML Model for traffic and emergency vehicle detection
const MLTrafficPredictor = {
  predictTraffic: (direction, hour, weather, historicalData) => {
    const baseTraffic = { N: 10, E: 8, S: 12, W: 6 };
    const timeFactor = 
      hour >= 7 && hour < 9 ? 3.5 :    // Morning rush
      hour >= 17 && hour < 19 ? 3.0 :   // Evening rush
      hour >= 22 || hour < 5 ? 0.5 :    // Night
      1.0;                              // Normal
    const weatherFactor = 
      weather === 'rainy' ? 0.8 :
      weather === 'foggy' ? 0.7 :
      1.0;
    const historicalAvg = historicalData.reduce((sum, data) => 
      sum + (data.traffic[direction] || 0), 0) / (historicalData.length || 1);
    return Math.max(1, Math.round(
      baseTraffic[direction] * 
      timeFactor * 
      weatherFactor * 
      (historicalAvg / 10 || 1) * 
      (0.8 + Math.random() * 0.4)
    ));
  },
  detectEmergencyVehicle: (direction, trafficVolume) => {
    return Math.random() < (0.02 + trafficVolume / 200) ? direction : null;
  }
};

function TrafficCard({ dir, data, signalPulse, timings, onEmergency, label, activeDirection, dashboardMode, violationPenalty }) {
  const hasPedestrian = data[`pedestrian_${dir}`];
  
  return (
    <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
      <Card className={`w-56 border rounded-xl p-4 shadow-lg transition-all ${
        dashboardMode === 'night' ? 'bg-gray-800 border-blue-800/50' :
        dashboardMode === 'emergency' ? 'bg-red-900/30 border-red-700' :
        'bg-gradient-to-br from-slate-700 to-gray-800 border-gray-600'
      } ${dir === data.emergencyDirection ? 'ring-2 ring-yellow-400' : ''}`}>
        <CardContent className="text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="flex flex-col items-center">
                {signalPulse(dir)}
                {hasPedestrian && (
                  <motion.div
                    className="text-xs bg-green-900/70 text-green-200 px-1 rounded mt-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    Pedestrian
                  </motion.div>
                )}
              </div>
            </div>

            <h3 className={`text-lg font-bold mb-2 ${
              dashboardMode === 'emergency' ? 'text-white' : 
              dashboardMode === 'night' ? 'text-blue-200' : 'text-white'
            }`}>
              {label}
            </h3>

            <div className="w-full mb-3">
              <label className="text-xs text-gray-300 mb-1 block">Vehicles Detected</label>
              <div className={`text-2xl font-mono font-bold ${
                data[`lane_${dir}`] > 30 ? 'text-red-400' : 
                data[`lane_${dir}`] > 15 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {data[`lane_${dir}`]}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <div className="bg-gray-800/50 p-1 rounded">
                <div>Green</div>
                <div className="font-bold text-green-400">{timings[`green_${dir}`] || 15}s</div>
              </div>
              <div className="bg-gray-800/50 p-1 rounded">
                <div>Wait</div>
                <div className="font-bold text-red-400">{(timings[`wait_${dir}`] || 105) + (violationPenalty[dir] || 0)}s</div>
              </div>
            </div>

            <div className="mt-3 w-full">
              <Button
                onClick={() => onEmergency(dir)}
                className={`w-full py-1 text-xs ${
                  dir === data.emergencyDirection ? 
                  'bg-gradient-to-r from-yellow-500 to-amber-600' : 
                  'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {dir === data.emergencyDirection ? '🚨 Active' : 'Emergency'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TrafficDashboard() {
  const [showIntro, setShowIntro] = useState(true);
  const [dashboardMode, setDashboardMode] = useState('standard');
  const [trafficData, setTrafficData] = useState({
    lane_N: 12, lane_E: 8, lane_S: 18, lane_W: 6,
    ambulance: false, emergencyDirection: null,
    horn_N: 0, horn_E: 0, horn_S: 0, horn_W: 0,
    pollution_N: 45, pollution_E: 38, pollution_S: 52, pollution_W: 41,
    pedestrian_N: false, pedestrian_E: false, pedestrian_S: false, pedestrian_W: false,
  });
  const [violations, setViolations] = useState([]);
  const [violationPenalty, setViolationPenalty] = useState({ N: 0, E: 0, S: 0, W: 0 });
  const [stats, setStats] = useState({
    totalViolations: 0,
    efficiency: 92,
    avgWaitTime: 45,
  });
  const [weather, setWeather] = useState({
    condition: 'sunny',
    visibility: 'excellent',
    temperature: 28
  });
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [timings, setTimings] = useState({
    green_N: 15, green_E: 15, green_S: 15, green_W: 15,
    wait_N: 105, wait_E: 105, wait_S: 105, wait_W: 105
  });
  const directions = useMemo(() => ['N', 'E', 'S', 'W'], []);
  const directionNames = useMemo(() => ({
    N: 'North', E: 'East', S: 'South', W: 'West'
  }), []);
  const [activeDirection, setActiveDirection] = useState('N');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [voiceAssistant, setVoiceAssistant] = useState(false);
  const audioRef = useRef(null);
  const [cameraFeeds, setCameraFeeds] = useState({
    N: '/camera-north.jpg',
    E: '/camera-east.jpg',
    S: '/camera-south.jpg',
    W: '/camera-west.jpg'
  });
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [trafficPatterns, setTrafficPatterns] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    alertSound: true,
    darkMode: false,
    autoEmergency: true
  });

  // Refs for signal control persistence
  const cycleStartTimeRef = useRef(Date.now());
  const currentPhaseIndexRef = useRef(0);

  // Ref for emergency timeout
  const timeoutRef = useRef(null);

  // Ref to track component mount state
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized functions
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window && userPreferences.alertSound) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [userPreferences.alertSound]);

  const detectTraffic = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const newTraffic = {};
    directions.forEach(dir => {
      newTraffic[`lane_${dir}`] = MLTrafficPredictor.predictTraffic(dir, hour, weather.condition, historicalData);
      newTraffic[`pollution_${dir}`] = Math.min(100, 30 + newTraffic[`lane_${dir}`] * 1.2);
    });
    
    setTrafficData(prev => ({
      ...prev,
      ...newTraffic,
    }));
    
    if (voiceAssistant) {
      speak("Traffic patterns updated based on ML predictions.");
    }
  }, [directions, weather.condition, historicalData, voiceAssistant, speak]);

  const detectViolations = useCallback(() => {
    const types = [
      'Helmet Not Worn', 'Line Crossing Before Green', 'Over Speeding',
      'Wrong Way Driving', 'Signal Jumping', 'Triple Riding', 'No License Plate'
    ];
    const newViolations = directions
      .filter(() => Math.random() < 0.3)
      .map(dir => ({
        type: types[Math.floor(Math.random() * types.length)],
        direction: directionNames[dir],
        timestamp: new Date().toLocaleTimeString(),
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        image: `/violation-${Math.floor(Math.random() * 5) + 1}.jpg`
      }));

    if (newViolations.length > 0) {
      setViolations(prev => [...newViolations, ...prev.slice(0, 10)]);
      setStats(prev => ({...prev, totalViolations: prev.totalViolations + newViolations.length}));
      
      const newPenalties = { ...violationPenalty };
      newViolations.forEach(v => {
        const dirKey = Object.keys(directionNames).find(key => directionNames[key] === v.direction);
        newPenalties[dirKey] = (newPenalties[dirKey] || 0) + 10;
      });
      setViolationPenalty(newPenalties);

      if (voiceAssistant) {
        newViolations.forEach(v => {
          speak(`Violation detected: ${v.type} at ${v.direction}. Applying 10-second penalty.`);
        });
      }
    }
  }, [directions, directionNames, violationPenalty, voiceAssistant, speak]);

  const detectHornUsage = useCallback(() => {
    const updated = { ...trafficData };
    directions.forEach((dir) => {
      const trafficLevel = trafficData[`lane_${dir}`] / 50;
      const randomHorn = Math.random() < (0.1 + trafficLevel * 0.2) ? 1 : 0;
      updated[`horn_${dir}`] += randomHorn;
      
      if (randomHorn > 0 && voiceAssistant) {
        speak(`Horn detected in ${directionNames[dir]} direction`);
      }
    });
    setTrafficData(updated);
  }, [directions, trafficData, voiceAssistant, directionNames, speak]);

  const calculateTimings = useCallback((data) => {
    const totalVehicles = Math.max(1, directions.reduce((sum, dir) => sum + data[`lane_${dir}`], 0));
    const baseCycleTime = 120; // Fixed cycle time for consistency
    const minGreenTime = 15;
    const maxGreenTime = 60;
    
    const newTimings = {};
    let totalGreenTime = 0;

    // Calculate green times based on traffic
    directions.forEach(dir => {
      const vehicleCount = data[`lane_${dir}`];
      const pedestrianFactor = data[`pedestrian_${dir}`] ? 1.5 : 1;
      const hornFactor = data[`horn_${dir}`] > 5 ? 1.2 : 1;
      const penaltyTime = violationPenalty[dir] || 0;

      let greenTime = Math.round((vehicleCount / totalVehicles) * baseCycleTime * pedestrianFactor * hornFactor);
      greenTime = Math.max(minGreenTime, Math.min(maxGreenTime, greenTime));
      
      newTimings[`green_${dir}`] = greenTime;
      totalGreenTime += greenTime;
    });

    // Adjust green times to fit the base cycle time and calculate wait times
    const adjustmentFactor = baseCycleTime / totalGreenTime;
    directions.forEach(dir => {
      newTimings[`green_${dir}`] = Math.round(newTimings[`green_${dir}`] * adjustmentFactor);
      const waitTime = baseCycleTime - newTimings[`green_${dir}`] + (violationPenalty[dir] || 0);
      newTimings[`wait_${dir}`] = waitTime;
    });

    return newTimings;
  }, [directions, violationPenalty]);

  const generateRecommendations = useCallback(() => {
    const recs = [];
    const highHorn = directions.some(dir => trafficData[`horn_${dir}`] > 8);
    const highPollution = directions.some(dir => trafficData[`pollution_${dir}`] > 60);
    const heavyTraffic = directions.some(dir => trafficData[`lane_${dir}`] > 50);

    if (highHorn) recs.push("High horn usage detected. Adjust signal timings to reduce congestion.");
    if (highPollution) recs.push("Rising pollution levels. Suggest traffic diversion to alternate routes.");
    if (violations.length > 5) recs.push("Multiple violations detected. Deploy traffic enforcement.");
    if (heavyTraffic) recs.push("Heavy traffic detected. Consider lane adjustments or one-way systems.");
    if (recs.length === 0) recs.push("Traffic flow optimal. No immediate actions required.");

    setAiRecommendations(recs);
  }, [directions, trafficData, violations]);

  const simulateWeather = useCallback(() => {
    const conditions = ['sunny', 'rainy', 'foggy', 'cloudy'];
    const visibilities = ['excellent', 'good', 'moderate', 'poor'];
    const newWeather = {
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      visibility: visibilities[Math.floor(Math.random() * visibilities.length)],
      temperature: 20 + Math.floor(Math.random() * 20)
    };
    setWeather(newWeather);
    
    if (newWeather.condition === 'rainy' && voiceAssistant) {
      speak("Weather alert: Rain detected. Adjusting signal timings for safety.");
    }
  }, [voiceAssistant, speak]);

  const updateCameraFeeds = useCallback(() => {
    directions.forEach(dir => {
      const randomNum = Math.floor(Math.random() * 5) + 1;
      setCameraFeeds(prev => ({
        ...prev,
        [dir]: `/camera-${dir.toLowerCase()}-${randomNum}.jpg?t=${Date.now()}`
      }));
    });
  }, [directions]);

  const generateHistoricalData = useCallback(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const newData = hours.map(hour => ({
      hour,
      traffic: directions.reduce((acc, dir) => ({
        ...acc,
        [dir]: Math.floor(Math.random() * 100)
      }), {}),
      violations: Math.floor(Math.random() * 20),
      efficiency: 70 + Math.floor(Math.random() * 30)
    }));
    setHistoricalData(newData);
  }, [directions]);

  const generateAlerts = useCallback(() => {
    const possibleAlerts = [
      { type: 'maintenance', message: 'System maintenance scheduled tonight at 2AM', severity: 'medium' },
      { type: 'camera', message: 'Camera N3 requires cleaning', severity: 'low' },
      { type: 'traffic', message: 'Accident reported on Main Street', severity: 'high' },
      { type: 'weather', message: 'Heavy rain expected in 30 minutes', severity: 'medium' }
    ];
    
    if (Math.random() > 0.7) {
      const newAlert = possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)];
      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      if (voiceAssistant) speak(`Alert: ${newAlert.message}`);
    }
  }, [voiceAssistant, speak]);

  const analyzeTrafficPatterns = useCallback(() => {
    const patterns = [
      "Morning rush hour detected (7-9 AM)",
      "Lunchtime lull observed (12-2 PM)",
      "Evening congestion building (5-7 PM)",
      "Weekend traffic patterns differ from weekdays"
    ];
    setTrafficPatterns(patterns.slice(0, Math.floor(Math.random() * patterns.length) + 1));
  }, []);

  const activateEmergency = useCallback((dir) => {
    // Clear any existing timeout to prevent overlap
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.log(`Activating emergency for direction: ${dir}`); // Debug log
    setTrafficData(prev => ({ ...prev, ambulance: true, emergencyDirection: dir }));
    if (voiceAssistant) speak(`Emergency vehicle detected from ${directionNames[dir]} direction. Clearing path.`);

    // Set a new timeout for auto-clearing emergency
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setTrafficData(prev => ({ ...prev, ambulance: false, emergencyDirection: null }));
        setDashboardMode('standard');
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (voiceAssistant) speak("Emergency cleared. Resuming normal operations.");
      }
    }, 30000 / simulationSpeed);
  }, [voiceAssistant, directionNames, simulationSpeed, speak]);

  // Initial setup
  useEffect(() => {
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      if (voiceAssistant) speak("TrafficCore AI system initialized. Monitoring traffic patterns.");
    }, 5000);
    
    generateHistoricalData();
    analyzeTrafficPatterns();
    
    const cameraInterval = setInterval(updateCameraFeeds, 15000);
    const alertInterval = setInterval(generateAlerts, 30000);
    
    return () => {
      clearTimeout(introTimer);
      clearInterval(cameraInterval);
      clearInterval(alertInterval);
    };
  }, [voiceAssistant, generateHistoricalData, analyzeTrafficPatterns, updateCameraFeeds, generateAlerts, speak]);

  // ML Traffic detection interval (every 2-3 minutes)
  useEffect(() => {
    detectTraffic();
    const interval = setInterval(detectTraffic, (120000 + Math.random() * 60000) / simulationSpeed);
    return () => clearInterval(interval);
  }, [simulationSpeed, detectTraffic]);

  // Emergency vehicle detection (every 2-3 minutes)
  useEffect(() => {
    if (!userPreferences.autoEmergency || trafficData.emergencyDirection) return;

    const detectEmergency = () => {
      directions.forEach(dir => {
        if (!trafficData.emergencyDirection) {
          const emergencyDir = MLTrafficPredictor.detectEmergencyVehicle(dir, trafficData[`lane_${dir}`]);
          if (emergencyDir) activateEmergency(emergencyDir);
        }
      });
    };

    const interval = setInterval(detectEmergency, (120000 + Math.random() * 60000) / simulationSpeed);
    return () => clearInterval(interval);
  }, [simulationSpeed, trafficData, userPreferences.autoEmergency, activateEmergency, directions]);

  // Main update loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimings(calculateTimings(trafficData));
      detectViolations();
      detectHornUsage();
      generateRecommendations();
      
      if (Math.random() < 0.3) simulateWeather();
      
      // Pedestrian detection
      const hour = new Date().getHours();
      if (Math.random() < (hour >= 8 && hour < 20 ? 0.3 : 0.1)) {
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        setTrafficData(prev => ({...prev, [`pedestrian_${randomDir}`]: true}));
        setTimeout(() => {
          setTrafficData(prev => ({...prev, [`pedestrian_${randomDir}`]: false}));
        }, 8000);
      }
    }, 5000 / simulationSpeed);
    
    return () => clearInterval(interval);
  }, [simulationSpeed, voiceAssistant, trafficData, violationPenalty, calculateTimings, detectViolations, detectHornUsage, generateRecommendations, simulateWeather, directions]);

  // Signal control logic with synchronized timing
  useEffect(() => {
    const intervalId = setInterval(() => {
      const updateSignal = () => {
        // Calculate phase durations dynamically to reflect latest timings
        const phaseDurations = directions.map(dir => ({
          direction: dir,
          greenTime: (timings[`green_${dir}`] || 15) * 1000,
        }));
        const cycleDuration = phaseDurations.reduce((sum, phase) => sum + phase.greenTime, 0);

        if (trafficData.emergencyDirection) {
          setActiveDirection(trafficData.emergencyDirection);
          setDashboardMode('emergency');
          if (audioRef.current) {
            audioRef.current.play().catch(err => console.error('Audio play error:', err));
          }
          return;
        }

        setDashboardMode('standard');
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const elapsed = (Date.now() - cycleStartTimeRef.current) / simulationSpeed;
        let accumulatedTime = 0;

        for (let i = 0; i < phaseDurations.length; i++) {
          const phase = phaseDurations[i];
          accumulatedTime += phase.greenTime;

          if (elapsed < accumulatedTime) {
            if (currentPhaseIndexRef.current !== i) {
              currentPhaseIndexRef.current = i;
              setActiveDirection(phase.direction);
              console.log(`Signal changed to ${phase.direction} (Green for ${phase.greenTime / 1000}s)`);
            }
            break;
          }
        }

        if (elapsed >= cycleDuration) {
          cycleStartTimeRef.current = Date.now();
          currentPhaseIndexRef.current = 0;
          setActiveDirection(directions[0]);
          console.log(`Cycle reset, starting with ${directions[0]}`);
        }
      };

      updateSignal();

      // Update efficiency
      const totalWait = directions.reduce((sum, dir) => 
        sum + (timings[`wait_${dir}`] || 105) + (violationPenalty[dir] || 0), 0);
      const avgWait = totalWait / 4;
      const efficiency = Math.max(0, 100 - (avgWait / 2));
      setStats(prev => ({
        ...prev,
        efficiency: Math.round(efficiency),
        avgWaitTime: Math.round(avgWait)
      }));
    }, 50); // Fixed interval for stable updates

    return () => clearInterval(intervalId);
  }, [simulationSpeed, trafficData.emergencyDirection, violationPenalty, directions, timings]);

  const clearEmergency = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setTrafficData(prev => ({ ...prev, ambulance: false, emergencyDirection: null }));
    setDashboardMode('standard');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (voiceAssistant) speak("Emergency cleared. Resuming normal operations.");
  }, [voiceAssistant, speak]);

  const toggleNightMode = useCallback(() => {
    setDashboardMode(prev => prev === 'night' ? 'standard' : 'night');
    setUserPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const toggleAnalytics = useCallback(() => setShowAnalytics(prev => !prev), []);

  const toggleVoiceAssistant = useCallback(() => {
    setVoiceAssistant(prev => !prev);
    if (!voiceAssistant) speak("Voice assistant activated. Monitoring traffic events.");
  }, [voiceAssistant, speak]);

  const handleViewCamera = useCallback((dir) => {
    setSelectedCamera(dir);
    setActiveTab('cameras');
  }, []);

  const dismissAlert = useCallback((index) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const togglePreference = useCallback((pref) => {
    setUserPreferences(prev => ({
      ...prev,
      [pref]: !prev[pref]
    }));
  }, []);

  const signalPulse = useCallback((dir) => (
    <motion.div
      className={`w-5 h-5 rounded-full mb-2 ${
        activeDirection === dir ? 'bg-green-500' : 'bg-red-600'
      } ${dashboardMode === 'night' ? 'opacity-90' : ''}`}
      animate={{ 
        opacity: [1, 0.7, 1],
        boxShadow: activeDirection === dir ? 
          ['0 0 0 0 rgba(74, 222, 128, 0.4)', '0 0 0 10px rgba(74, 222, 128, 0)', '0 0 0 0 rgba(74, 222, 128, 0)'] : 
          ['0 0 0 0 rgba(239, 68, 68, 0.4)', '0 0 0 10px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0)']
      }}
      transition={{ 
        opacity: { repeat: Infinity, duration: 1.5 },
        boxShadow: { repeat: Infinity, duration: 2 }
      }}
    />
  ), [activeDirection, dashboardMode]);

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, type: 'spring' }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6">
              TrafficCore AI
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Next-generation intelligent traffic management system powered by AI
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <div className="flex justify-center space-x-4">
              <div className="h-4 w-4 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-4 w-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-4 w-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-sm text-gray-500 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            Initializing system components...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-500 ${
      dashboardMode === 'night' ? 'bg-gray-900 text-blue-100' : 
      dashboardMode === 'emergency' ? 'bg-red-900/20 text-white' : 
      'bg-gradient-to-br from-slate-800 via-gray-900 to-black text-white'
    }`}>
      <audio ref={audioRef} src="/emergency-alarm.mp3" loop />
      
      {alerts.length > 0 && (
        <motion.div className="mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">🔔</span> System Alerts
            </h4>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    alert.severity === 'high' ? 'bg-red-900/40' :
                    alert.severity === 'medium' ? 'bg-amber-900/40' : 'bg-blue-900/40'
                  }`}
                >
                  <div>
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-xs ml-2 opacity-70">{alert.type}</span>
                  </div>
                  <button 
                    onClick={() => dismissAlert(i)}
                    className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded"
                  >
                    Dismiss
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex border-b border-gray-700 mb-6">
        {['dashboard', 'cameras', 'history', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
          >
            {tab === 'dashboard' ? '🏠 Dashboard' :
             tab === 'cameras' ? '📷 Camera Feeds' :
             tab === 'history' ? '📊 Historical Data' :
             '⚙️ Settings'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex justify-between items-center mb-6">
            <motion.h1 className="text-4xl font-bold text-yellow-300 flex items-center" whileHover={{ scale: 1.02 }}>
              <span className="mr-3">🚦</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500">
                TrafficCore AI
              </span>
              <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">PRO</span>
            </motion.h1>
            
            <div className="flex space-x-3">
              <Button 
                onClick={toggleNightMode}
                className={`px-4 py-2 rounded-full ${dashboardMode === 'night' ? 'bg-blue-800' : 'bg-gray-800'}`}
              >
                {dashboardMode === 'night' ? '☀️ Day Mode' : '🌙 Night Mode'}
              </Button>
              <Button 
                onClick={toggleVoiceAssistant}
                className={`px-4 py-2 rounded-full ${voiceAssistant ? 'bg-green-600' : 'bg-gray-800'}`}
              >
                {voiceAssistant ? '🎤 Assistant ON' : '🔇 Assistant OFF'}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-8 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className={`text-3xl ${
                weather.condition === 'sunny' ? 'text-yellow-400' :
                weather.condition === 'rainy' ? 'text-blue-400' :
                weather.condition === 'foggy' ? 'text-gray-400' : 'text-white'
              }`}>
                {weather.condition === 'sunny' ? '☀️' : 
                 weather.condition === 'rainy' ? '🌧️' : 
                 weather.condition === 'foggy' ? '🌫️' : '☁️'}
              </div>
              <div>
                <p className="font-semibold">{weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)}</p>
                <p className="text-sm text-gray-300">{weather.temperature}°C • Visibility: {weather.visibility}</p>
              </div>
            </div>
            
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-300">System Efficiency</p>
                <p className="text-2xl font-bold text-green-400">{stats.efficiency}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Avg Wait Time</p>
                <p className="text-2xl font-bold text-amber-400">{stats.avgWaitTime}s</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Violations Today</p>
                <p className="text-2xl font-bold text-red-400">{stats.totalViolations}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">Sim Speed:</span>
              <select 
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="bg-gray-800 text-white rounded px-2 py-1 text-sm"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 grid-rows-3 gap-6 justify-items-center items-center mb-8">
            <div className="row-start-1 col-start-2">
              <TrafficCard 
                dir="N" 
                data={trafficData} 
                signalPulse={signalPulse} 
                timings={timings} 
                onEmergency={activateEmergency} 
                label={directionNames['N']} 
                activeDirection={activeDirection}
                dashboardMode={dashboardMode}
                violationPenalty={violationPenalty}
              />
            </div>
            <div className="row-start-2 col-start-1">
              <TrafficCard 
                dir="W" 
                data={trafficData} 
                signalPulse={signalPulse} 
                timings={timings} 
                onEmergency={activateEmergency} 
                label={directionNames['W']} 
                activeDirection={activeDirection}
                dashboardMode={dashboardMode}
                violationPenalty={violationPenalty}
              />
            </div>
            <div className="row-start-2 col-start-2">
              <motion.div 
                className={`w-44 h-44 rounded-full flex items-center justify-center font-bold text-lg shadow-xl border-4 ${
                  dashboardMode === 'emergency' ? 'border-red-600 bg-gradient-to-r from-red-800 to-red-600' :
                  dashboardMode === 'night' ? 'border-blue-600 bg-gradient-to-r from-blue-900 to-blue-700' :
                  'border-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                }`}
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ scale: { repeat: Infinity, duration: 3, ease: "easeInOut" }, rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" } }}
              >
                <div className="text-center">
                  <div className="text-2xl">AI TRAFFIC</div>
                  <div className="text-2xl">HUB</div>
                  {dashboardMode === 'emergency' && (
                    <motion.div 
                      className="text-sm mt-2 text-white"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      EMERGENCY MODE
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="row-start-2 col-start-3">
              <TrafficCard 
                dir="E" 
                data={trafficData} 
                signalPulse={signalPulse} 
                timings={timings} 
                onEmergency={activateEmergency} 
                label={directionNames['E']} 
                activeDirection={activeDirection}
                dashboardMode={dashboardMode}
                violationPenalty={violationPenalty}
              />
            </div>
            <div className="row-start-3 col-start-2">
              <TrafficCard 
                dir="S" 
                data={trafficData} 
                signalPulse={signalPulse} 
                timings={timings} 
                onEmergency={activateEmergency} 
                label={directionNames['S']} 
                activeDirection={activeDirection}
                dashboardMode={dashboardMode}
                violationPenalty={violationPenalty}
              />
            </div>
          </div>

          <div className="text-center mt-6 mb-10">
            <Button
              onClick={clearEmergency}
              className={`px-8 py-4 rounded-full text-white font-semibold transition-all hover:scale-105 shadow-lg text-lg ${
                trafficData.ambulance
                  ? 'bg-gradient-to-r from-red-600 to-yellow-400 animate-pulse'
                  : 'bg-gradient-to-r from-green-600 to-lime-500'
              }`}
            >
              {trafficData.ambulance ? '🛑 Clear Emergency' : '🚨 Emergency Override'}
            </Button>
            
            {trafficData.emergencyDirection && (
              <motion.p 
                className="mt-3 text-red-300 font-medium text-xl"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                🚑 Emergency at {directionNames[trafficData.emergencyDirection]}
              </motion.p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-xl border ${
              dashboardMode === 'night' ? 'bg-gray-800/70 border-gray-700' :
              dashboardMode === 'emergency' ? 'bg-red-900/30 border-red-800' :
              'bg-white/10 border-gray-700'
            }`}>
              <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center">
                <span className="mr-2">⚠️</span> Recent Traffic Violations
                <span className="ml-auto text-sm bg-red-500/30 px-2 py-1 rounded-full">
                  {violations.length} detected
                </span>
              </h3>
              
              {violations.length > 0 ? (
                <div className="space-y-3">
                  {violations.slice(0, 5).map((v, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-3 rounded-lg flex items-start ${
                        v.severity === 'high' ? 'bg-red-900/40' :
                        v.severity === 'medium' ? 'bg-amber-900/40' : 'bg-gray-800/40'
                      }`}
                    >
                      <div className="mr-3 mt-1">
                        {v.severity === 'high' ? '🔴' : v.severity === 'medium' ? '🟡' : '🔵'}
                      </div>
                      <div>
                        <div className="font-medium">{v.type}</div>
                        <div className="text-sm text-gray-300">At {v.direction} • {v.timestamp}</div>
                      </div>
                      <button className="ml-auto text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded">
                        View
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <div className="text-5xl mb-2">🕊️</div>
                  <p>No violations detected currently</p>
                </div>
              )}
            </div>
            
            <div className={`p-6 rounded-xl border ${
              dashboardMode === 'night' ? 'bg-gray-800/70 border-gray-700' :
              dashboardMode === 'emergency' ? 'bg-red-900/30 border-red-800' :
              'bg-white/10 border-gray-700'
            }`}>
              <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center">
                <span className="mr-2">🧠</span> AI Recommendations
                <button 
                  onClick={generateRecommendations}
                  className="ml-auto text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-full"
                >
                  Refresh
                </button>
              </h3>
              
              {aiRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {aiRecommendations.map((rec, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-gray-800/40 rounded-lg flex items-start"
                    >
                      <div className="mr-3 text-blue-400">💡</div>
                      <div>{rec}</div>
                      <button className="ml-auto text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded">
                        Action
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <div className="text-5xl mb-2">🤖</div>
                  <p>Analyzing traffic patterns...</p>
                </div>
              )}
            </div>
            
            <div className={`p-6 rounded-xl border ${
              dashboardMode === 'night' ? 'bg-gray-800/70 border-gray-700' :
              dashboardMode === 'emergency' ? 'bg-red-900/30 border-red-800' :
              'bg-white/10 border-gray-700'
            }`}>
              <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
                <span className="mr-2">🌿</span> Environmental Data
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {directions.map(dir => (
                  <div key={dir} className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="font-medium text-center mb-2">{directionNames[dir]}</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Air Quality:</span>
                      <span className={`${
                        trafficData[`pollution_${dir}`] > 60 ? 'text-red-400' :
                        trafficData[`pollution_${dir}`] > 40 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {trafficData[`pollution_${dir}`]} AQI
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pedestrians:</span>
                      <span className={trafficData[`pedestrian_${dir}`] ? 'text-green-400' : 'text-gray-400'}>
                        {trafficData[`pedestrian_${dir}`] ? 'Detected' : 'None'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">System Controls</h4>
                <div className="flex space-x-2">
                  <Button 
                    onClick={toggleAnalytics}
                    className="text-xs py-1 px-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                  </Button>
                  <Button 
                    className="text-xs py-1 px-2 bg-amber-600 hover:bg-amber-700"
                  >
                    Generate Report
                  </Button>
                  <Button 
                    className="text-xs py-1 px-2 bg-gray-700 hover:bg-gray-600"
                  >
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {showAnalytics && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-6 p-6 rounded-xl border overflow-hidden ${
                dashboardMode === 'night' ? 'bg-gray-800/70 border-gray-700' :
                dashboardMode === 'emergency' ? 'bg-red-900/30 border-red-800' :
                'bg-white/10 border-gray-700'
              }`}
            >
              <h3 className="text-xl font-bold text-purple-300 mb-4">📊 Advanced Traffic Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-center">Traffic Flow</h4>
                  <div className="h-40 flex items-end space-x-2">
                    {directions.map(dir => (
                      <div key={dir} className="flex-1 flex flex-col items-center">
                        <motion.div
                          className={`w-full ${
                            dir === 'N' ? 'bg-blue-500' :
                            dir === 'E' ? 'bg-green-500' :
                            dir === 'S' ? 'bg-yellow-500' : 'bg-purple-500'
                          } rounded-t-sm`}
                          initial={{ height: 0 }}
                          animate={{ height: `${trafficData[`lane_${dir}`] * 2}px` }}
                          transition={{ duration: 1 }}
                        />
                        <span className="text-xs mt-1">{directionNames[dir]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-center">Violation Types</h4>
                  <div className="h-40 flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      {['Helmet', 'Speeding', 'Signal Jump'].map((type, i) => (
                        <div 
                          key={type}
                          className="absolute inset-0"
                          style={{
                            clipPath: `circle(50% at 50% 50%)`,
                            background: 'conic-gradient(' + 
                              `from ${i * 120}deg at 50% 50%, ` +
                              `#${['ff6b6b', '48dbfb', 'feca57'][i]} ` +
                              `0 ${(i+1)*33}%, transparent 0)`
                          }}
                        />
                      ))}
                      <div className="absolute inset-4 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-xs">Total: {stats.totalViolations}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4 mt-2">
                    {['Helmet', 'Speeding', 'Signal Jump'].map((type, i) => (
                      <div key={type} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-1" 
                          style={{ backgroundColor: `#${['ff6b6b', '48dbfb', 'feca57'][i]}` }}
                        />
                        <span className="text-xs">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-center">Efficiency Trend</h4>
                  <div className="h-40 relative">
                    <div className="absolute bottom-0 w-full h-px bg-gray-600"></div>
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        className="absolute bottom-0 w-8 bg-green-500 rounded-t-sm"
                        style={{ left: `${i * 20 + 10}%` }}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 80 + 20}px` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    ))}
                    <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-400">
                      <span>9AM</span>
                      <span>12PM</span>
                      <span>3PM</span>
                      <span>6PM</span>
                      <span>Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'cameras' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {selectedCamera ? (
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {directionNames[selectedCamera]} Camera Feed
                </h2>
                <button 
                  onClick={() => setSelectedCamera(null)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
                >
                  Back to All Cameras
                </button>
              </div>
              <div className="relative bg-black rounded-xl overflow-hidden">
                <img 
                  src={cameraFeeds[selectedCamera]} 
                  alt={`${directionNames[selectedCamera]} camera`}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Live Feed • {new Date().toLocaleTimeString()}
                    </span>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                        Zoom In
                      </button>
                      <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm">
                        Capture
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            directions.map(dir => (
              <motion.div
                key={dir}
                whileHover={{ scale: 1.02 }}
                className="bg-black rounded-xl overflow-hidden shadow-lg"
              >
                <div className="relative">
                  <img 
                    src={cameraFeeds[dir]} 
                    alt={`${directionNames[dir]} camera`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {directionNames[dir]} Camera
                      </span>
                      <button 
                        onClick={() => handleViewCamera(dir)}
                        className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                      >
                        View Fullscreen
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">24-Hour Traffic Volume</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="traffic.N" 
                      name="North" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.2} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="traffic.S" 
                      name="South" 
                      stroke="#F59E0B" 
                      fill="#F59E0B" 
                      fillOpacity={0.2} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-4">System Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                      stroke="#9CA3AF"
                    />
                    <YAxis yAxisId="left" stroke="#9CA3AF" />
                    <YAxis yAxisId="right" orientation="right" stroke="#EC4899" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="violations" 
                      name="Violations" 
                      fill="#EC4899" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="efficiency" 
                      name="Efficiency %" 
                      stroke="#10B981" 
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Detected Traffic Patterns</h3>
            {trafficPatterns.length > 0 ? (
              <ul className="space-y-3">
                {trafficPatterns.map((pattern, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 mt-1">🔍</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No significant patterns detected yet</p>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white/10 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4">User Preferences</h3>
            <div className="space-y-4">
              {['alertSound', 'darkMode', 'autoEmergency'].map(pref => (
                <div key={pref} className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <span>{pref === 'alertSound' ? 'Alert Sounds' : 
                           pref === 'darkMode' ? 'Dark Mode' : 'Auto Emergency Mode'}</span>
                  </label>
                  <Switch
                    checked={userPreferences[pref]}
                    onChange={() => togglePreference(pref)}
                    className={`${
                      userPreferences[pref] ? 'bg-blue-600' : 'bg-gray-700'
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                  >
                    <span
                      className={`${
                        userPreferences[pref] ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </Switch>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold mb-4">System Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Version</span>
                <span>TrafficCore AI v2.4.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Last Updated</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Connected Devices</span>
                <span>12 cameras, 8 sensors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">System Status</span>
                <span className="text-green-400">All systems operational</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-sm py-1">Backup Data</Button>
                <Button className="bg-gray-700 hover:bg-gray-600 text-sm py-1">System Diagnostics</Button>
                <Button className="bg-amber-600 hover:bg-amber-700 text-sm py-1">Update Software</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-sm py-1">Emergency Shutdown</Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}