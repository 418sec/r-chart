# r-chart (react editable line chart and bar chart)

### description
* create line chart , bar chart and combo chart.
* editable points By drag or popup.  
* developed by reactjs.
* responsive.
* customizable style.
* zoomable.
* up to 1000000 point support.

### Instalation
```npm i r-chart```

### Usage
``` javascript
import react from "react";
import Chart from "r-chart";
<Chart />
```

### Basic
##### Code:
```javascript
<Chart
    data={[
      {
        type:'line',
        title:'data',
        color:'blue',
        points:[
          {key:'January',value:10},
          {key:'February',value:15},
          {key:'March',value:25},
          {key:'April',value:30},
          {key:'May',value:40},
          {key:'June',value:35},
          {key:'July',value:40},
          {key:'August',value:60},
          {key:'September',value:60},
          {key:'October',value:75},
          {key:'November',value:80},
          {key:'December',value:100}
        ],
      }
    ]}
    keys={[
      'January','February','March','April','May','June','July','August','September','October','November','December'
    ]}
 />
 ```
##### Preview:
[![GitHub Logo](/images/basic.jpg)](https://www.google.com)



### Label Size
###### Set width of horizontal axis labels by 'labelSize' prop to prevent those to interference .
##### Code:
```javascript
<Chart
  ...
  labelSize={90}
  ...
/>
```
##### Preview:
![alt text](/images/label%20size.jpg)



### Edit Labels
###### Set 'key_editLabel' function to edit 'key axis' labels.
###### Set 'value_editLabel' function to edit 'value axis' labels.
##### Code:
```javascript
<Chart
  ...
  key_editLabel={(key)=>key.slice(0,3)}
  value_editLabel={(value)=>value + '%'}
  ...
/>`
```
##### Preview:
![GitHub Logo](/images/edit%20labels.jpg)



### Grid Lines
###### Set 'key_gridColor' to show and set color of grid lines on key axis.
###### Set 'value_gridColor' to show and set color of grid lines on value axis.
##### Code:
```javascript
<Chart
  ...
  key_gridColor={'#ddd'}
  value_gridColor={'#ddd'}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/grid%20lines.jpg)



### Get key and value from points object
###### Read key from point object by 'getKey' prop function on data.
###### Read value from point object by 'getValue' prop function on data.
##### Code:
```javascript
<Chart
  ...
  data={[
    {
      type:'line',
      title:'data',
      color:'blue',
      points:[
        {date:'January',percent:10},
        {date:'February',percent:15},
        {date:'March',percent:25},
        {date:'April',percent:30},
        {date:'May',percent:40},
        {date:'June',percent:35},
        {date:'July',percent:40},
        {date:'August',percent:60},
        {date:'September',percent:60},
        {date:'October',percent:75},
        {date:'November',percent:80},
        {date:'December',percent:100}
      ],
    }
  ]}
  keys={[
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ]}
  getKey={({point,dataIndex,pointIndex})=>point.date}
  getValue={({point,dataIndex,pointIndex})=>point.percent}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/get%20key%20get%20value.jpg)



### Set Multi Data by diffrent styles
###### Set 3 data on 'data' prop by diffrent styles.
###### Controlling line chart style by 'dash' , 'lineWidth' , 'color' and 'areaOpacity' property on data
##### Code:
```javascript
<Chart
  ...
  data={[
    {
      ...
      title:'data1',
      color:'blue',
      dash:[4,2],
      areaOpacity:0.2
      ...
    },
    {
      ...
      title:'data2',
      color:'#03ebcc',
      lineWidth:4,
      ...
    },
    {
      ...
      title:'data3',
      color:'#e414c8',
      dash:[7,5],
    }
  ]}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/multi%20data.jpg)



### Set Point Style
###### Set circle on each points by set 'pointStyle' prop on data (object type).
##### Code:
```javascript
<Chart
  ...
  data={[
    {
      ...
      pointStyle:{
        radius:5
      }
      ...
    }
  ]}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/point%20style%201.jpg)
###### Set circle on each points by set 'pointStyle' prop on data (object type).
##### Code:
```javascript
<Chart
  ...
  data={[
    {
      ...
      pointStyle:{
        radius:5,fill:'blue',stroke:'rgba(0,0,255,.1)',lineWidth:6
      }
      ...
    }
  ]}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/point%20style%202.jpg)
###### Set circle on each points by set 'pointStyle' prop on data (function type).
##### Code:
```javascript
<Chart
  ...
  data={[
    {
      ...
      pointStyle:({point,dataIndex,pointIndex})=>{
        if(pointIndex === 0){
          return {radius:5,fill:'blue'}
        }
        if(point.date === 'August'){
          return {radius:8,stroke:'red',lineWidth:2,dash:[4,3]}
        }
        else{
          return {radius:5}
        }
      }
      ...
    }
  ]}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/point%20style%203.jpg)



### Set Lines
###### Set lines by 'lines' prop width custom style on 'keyAxis' and 'valueAxis' prop.
##### Code:
```javascript
<Chart
  ...
  key_lines={[
    {key:'June',dash:[2,2],color:'red',lineWidth:1}
  ]}
  value_lines={[
    {value:50,dash:[8,5],color:'blue',lineWidth:2}
  ]}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/set%20lines.jpg)



### Set Text On Points
###### Set text on each points by set 'text' prop (function) on data that read text value from point object and can get custom style.
##### Code:
```javascript
<Chart
  ...
  data={[
    {
      ...
      text:({point,dataIndex,pointIndex})=>{
        return {
          value:point.size,
          y:-20,
          fontSize:12,
          rotate:pointIndex === 11?90:0,
          align:[0,0]
        }
      }
      ...
    }
  ]}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/text.jpg)



### Rotate Horizontal Labels
###### rotate horizontal labels by 'labelRotate' props.
##### Code:
```javascript
<Chart
  ...
  labelRotate={45}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/label%20rotate.jpg)



### Set Axis Thickness
###### Set horizontal and vertical axis thickness by 'axisSize' props.
##### Code:
```javascript
<Chart
  ...
  value_editLabel={(value)=>value * 1000 + '$'}
  axisThickness={{horizontal:90,vertical:70}}
  labelRotate={90}
  labelSize={40}
  ...
/>
```
##### Preview:
![GitHub Logo](/images/axis%20thickness.jpg)




[**Demo on stackblitz**](https://stackblitz.com/edit/r-chart-qfx76m?embed=1&file=index.js)
