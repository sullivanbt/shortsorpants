import { StatusBar } from 'expo-status-bar';
import React, {useState} from 'react';
import {Text, StyleSheet, View, Pressable} from 'react-native';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import DateTimePicker from '@react-native-community/datetimepicker';

import ImageViewer from './components/ImageViewer'; 

const questionmarkImage = require('./assets/images/question_mark.png')
const shortsImage = require('./assets/images/shorts.png');
const pantsImage = require('./assets/images/pants.gif');

export default function App() {

  const [shortsOrPants, setShortsOrPants] = useState('tbd')
  const [checkingWeather, setCheckingWeather] = useState(false);
  const [numPresses, setNumPresses] = useState(0);
  const [weatherData, setWeatherData] = useState({})
  const [minDewPoint, setMinDewPoint] = useState(null)
  const [maxDewPoint, setMaxDewPoint] = useState(null)
  const [minTemp, setMinTemp] = useState(null)
  const [maxTemp, setMaxTemp] = useState(null)

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
    fetch(`https://api.weather.gov/gridpoints/TOP/32,81/forecast/hourly`)
      .then(res => res.json())
      .then(json => {
        // console.log(JSON.stringify(json));
        setWeatherData(json.properties.periods)
        if(startTime >= endTime){
          endTime.setDate(endTime.getDate() + 1)
        }
        let filteredWeatherData = json.properties.periods.filter((x) => (new Date(x.startTime) > startTime) & (new Date(x.startTime) < endTime))
        console.log(`Keeping ${filteredWeatherData.length} entries between ${startTime} and ${endTime}`)
        setCheckingWeather(false);
        console.log(filteredWeatherData.map(x=>calculateFeelsLike(x)))
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
        
      });
  }

  const handleButtonClick = () => {
    setWeatherData({})
    setMinDewPoint(null);
    setMaxDewPoint(null);
    setCheckingWeather(true);
    fetchWeather() 
  }

  const handleResetButtonClick = () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewer placeholderImageSource={shortsOrPants==='tbd' ? questionmarkImage : shortsOrPants==='shorts' ? shortsImage : pantsImage} />
      </View>
      <View style={styles.imageContainer}>
        {checkingWeather ? <Text>`Checking weather....`</Text>: null }
      </View>
      <View style={styles.imageContainer}>
        <Text></Text>
        <Text></Text>
        <Text>Min temp: {minTemp}</Text>
        <Text>Max temp: {maxTemp}</Text>
        <Text>Min dew point: {minDewPoint}</Text>
        <Text>Max dew point: {maxDewPoint}</Text>
      </View>
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

      </View>

      <StatusBar style="auto" />
      <View
      style={[styles.buttonContainer, { borderWidth: 5, borderColor: "#4B9CD3", borderRadius: 18 }]}
      >
        <Pressable
          style={[styles.button, { backgroundColor: "#fff" }]}
          onPress={handleButtonClick}
        >
          <FontAwesome
            name="question"
            size={18}
            color="#25292e"
            style={styles.buttonIcon}
          />
          <Text style={[styles.buttonLabel, { color: "#25292e" }]}>Shorts or Pants</Text>
        </Pressable>
        </View>
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

