import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, View, Pressable} from 'react-native';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

import ImageViewer from './components/ImageViewer'; 

const questionmarkImage = require('./assets/images/scales.png')
const shortsImage = require('./assets/images/shorts.png');
const pantsImage = require('./assets/images/pants.png');

export default function App() {

  const [shortsOrPants, setShortsOrPants] = useState('tbd')
  const [checkingWeather, setCheckingWeather] = useState(false);
  const [numPresses, setNumPresses] = useState(0);
  const [weatherData, setWeatherData] = useState({})
  const [minDewPoint, setMinDewPoint] = useState(null)
  const [maxDewPoint, setMaxDewPoint] = useState(null)
  const [minTemp, setMinTemp] = useState(null)
  const [maxTemp, setMaxTemp] = useState(null)
  
  const [location, setLocation] = useState({latitude: 0, longitude: 0});
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 4);
    return currentDate;
  });  
  const [mode, setMode] = useState('time');

  const calculateFeelsLike = (d) => {
    const t = d.temperature
    const rh = d.relativeHumidity.value
    return -42.379 + 
      (2.04901523 * t) +
      (10.14333127 * rh) - 
      (0.22475541 * t * rh) - 
      (6.83783e-3 * t * t ) -
      (5.481717e-2 * rh * rh) + 
      (1.22874e-3 * t * t * rh) + 
      (8.5282e-4 * t * rh * rh) - 
      (1.99e-6 * t * t * rh * rh)
  }

  fetchWeather = () => {
    fetch(`https://api.weather.gov/points/`+location.latitude.toFixed(8) + ',' + location.longitude.toFixed(8))
      .then(res => {
        return res.json()}
        )
      .then(j => {
        return fetch(j.properties.forecastHourly)
      })
      .then(res => {
        return res.json()
      })
      .then(json => {
          setWeatherData(json.properties.periods)
          if(startTime >= endTime){
            endTime.setDate(endTime.getDate() + 1)
          }
          let filteredWeatherData = json.properties.periods.filter((x) => (new Date(x.startTime) > startTime) & (new Date(x.startTime) < endTime))
          console.log(`Keeping ${filteredWeatherData.length} entries between ${startTime} and ${endTime}`)
          setCheckingWeather(false);
          console.log(filteredWeatherData.map(x=>x.temperature))
          const newMinTemp = Math.min(...filteredWeatherData.map((x)=>x.temperature))
          const newMaxTemp = Math.max(...filteredWeatherData.map((x)=>x.temperature))
          const newMinDewPoint = Math.min(...filteredWeatherData.map((x)=>x.dewpoint.value))*9.0/5.0 + 32
          const newMaxDewPoint = Math.max(...filteredWeatherData.map((x)=>x.dewpoint.value))*9.0/5.0 + 32
          setMinTemp(newMinTemp)
          setMaxTemp(newMaxTemp)
          setMinDewPoint(newMinDewPoint)
          setMaxDewPoint(newMaxDewPoint)
          if(newMaxTemp > 77){
            setShortsOrPants('shorts')
          } else {
            setShortsOrPants('pants')
          }
          
      })
    .catch(e => console.log("OH NO!", e))
    // fetch(`https://api.weather.gov/gridpoints/LOT/74,75/forecast/hourly`)
    //   .then(res => res.json())
      
  }

  const handleButtonClick = () => {
    setWeatherData({})
    setMinDewPoint(null);
    setMaxDewPoint(null);
    setCheckingWeather(true);
    fetchWeather() 
  }

  const handleResetButtonClick = () => {
    getLocation();
    setWeatherData({});
    setMinDewPoint(null);
    setMaxDewPoint(null);
    setMinTemp(null);
    setMaxTemp(null)
    setCheckingWeather(false);   
    setStartTime(new Date())
    setEndTime(() => {
      const currentDate = new Date();
      currentDate.setHours(currentDate.getHours() + 4);
      return currentDate;
    })
    setShortsOrPants('tbd')
  }
  
  const handleStartTimeChange = (v) => {
    setStartTime(new Date(v.nativeEvent.timestamp))
    const ts = new Date(v.nativeEvent.timestamp)
    console.log("Setting start time to be " + ts.toISOString())
  }  

  const handleEndTimeChange = (v) => {
    setEndTime(new Date(v.nativeEvent.timestamp))
    const ts = new Date(v.nativeEvent.timestamp)
    console.log("Setting end time to be " + ts.toISOString())
  }  

  // function to check permissions and get Location
  const getLocation = async () => {

    console.log('getting location')

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      setLocationPermissionGranted(false);
      return;
    }
    console.log(status)
    setLocationPermissionGranted(true);
    let new_location = await Location.getCurrentPositionAsync({});
    setLocation({latitude: new_location.coords.latitude, longitude: new_location.coords.longitude})

    console.log(`Found location long: ${new_location.coords.longitude.toFixed(2)} lat: ${new_location.coords.latitude.toFixed(2)}`)
  };


  useEffect(() => {
    (async () => {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionGranted(false);
        return;
      }
      setLocationPermissionGranted(true);
      let new_location = await Location.getCurrentPositionAsync({});
      setLocation({latitude: new_location.coords.latitude, longitude: new_location.coords.longitude})

    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer placeholderImageSource={shortsOrPants==='tbd' ? questionmarkImage : shortsOrPants==='shorts' ? shortsImage : pantsImage} />
      </View>

      {locationPermissionGranted ? 
      <View style={{flexDirection:'column'}}>
        <View style={{textAlign: 'center', alignItems: 'center'}}>
          <Text>I'm going out between</Text>
        </View> 
        <View style={{flexDirection: 'row'}}>
        <DateTimePicker
            testID="dateTimePicker"
            value={startTime}
            mode={mode}
            is24Hour={true}
            onChange={handleStartTimeChange}
          />
        <Text> and </Text>
        <DateTimePicker
            testID="dateTimePickerEnd"
            value={endTime}
            mode={mode}
            is24Hour={true}
            onChange={handleEndTimeChange}
            show={false}
          />
        </View>

      </View> : 
      <View>
        <Text style={{textAlign: 'center', alignItems: 'center'}}>Shorts or Pants needs location permissions to determine the weather. Please grant these permissions in your device's Settings screen.</Text>
        <Text></Text>
      </View> 
      }

      <StatusBar style="auto" />
      {locationPermissionGranted ? 
      <View
      style={locationPermissionGranted ? [styles.buttonContainer, { borderWidth: 5, borderColor: "#4B9CD3", borderRadius: 18 }] : [[styles.buttonContainer, { borderWidth: 5, borderColor: "#FF3333", borderRadius: 18 }]]}
      >
        <Pressable
          style={[styles.button, { backgroundColor: "#fff" }]}
          onPress={handleButtonClick}
          disabled={Math.abs(location.latitude) < 0.01}
        >
          <FontAwesome
            name="question"
            size={18}
            color="#25292e"
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonLabel, { color: "#25292e" }]}>{locationPermissionGranted ? Math.abs(location.latitude) > 0.00 ? 'Shorts or Pants' : 'Getting Location...' : `Grant Location Permissions to Use.`}</Text>
        </Pressable>
      </View> : null}
        <View
      style={[styles.buttonContainer, { borderWidth: 5, borderColor: "#4B9CD3", borderRadius: 18 }]}
      >
        <Pressable
          style={[styles.button, { backgroundColor: "#fff" }]}
          onPress={handleResetButtonClick}
        >
          <FontAwesome
            name="exclamation"
            size={18}
            color="#25292e"
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonLabel, { color: "#25292e" }]}>Start Over</Text>
        </Pressable>
      </View>
      <View><Text>  </Text></View>
      <View><Text>  </Text></View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    paddingTop: 58,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },  
  buttonContainer: {
    width: 320,
    height: 68,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  button: {
    borderRadius: 10,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderColor: '#4B9CD3'
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
  },  
});

