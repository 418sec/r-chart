import React,{Component,createRef,createContext} from 'react';
import RSlider from 'r-range-slider';
import RCanvas from 'r-canvas';
import $ from 'jquery';
import './index.css';

var RChartContext = createContext();
 export default class RChart extends Component{
    constructor(props){
      super(props);
      this.mouseDownDetail = {};
      var {data,filter} = this.props;
      this.touch = 'ontouchstart' in document.documentElement;
      var preventData = {};
      for(var i = 0; i < data.length; i++){
        let d = data[i];
        if(d.title === undefined){continue;}
        preventData[d.title] = false;
      }
      this.state = {popup:false,preventData,filter};
      this.dom = createRef();
      this.details = {};
      $('body').on('mouseout','.r-chart-canvas',()=>{$('.r-chart-popup-container').html('')})
    }
    translate(value){
      var dictionary = {
        'Add.Point':{en:'Add Point',fa:'افزودن نقطه'},
        'Edit.Point':{en:'Edit Point',fa:'ویرایش نقطه'},
        'Remove.Point':{en:'Remove Point',fa:'حذف نقطه'},
        'Add':{en:'Add',fa:'افزودن'},
        'Edit':{en:'Edit',fa:'ویرایش'},
        'Remove':{en:'Remove',fa:'حذف'},
        'Close':{en:'Close',fa:'بستن'},
      }
      return dictionary[value][this.props.globalization];
    }
    getStyle(x,y){
      return {
        gridTemplateColumns:`${x}px auto`,
        gridTemplateRows:`auto ${y}px`,
        direction:'ltr'
      }
    }
    getType(X,Y){return {x:X.labels?'string':'number',y:Y.labels?'string':'number'};}
    getLimitTypeNumber(data,axis){
      var min = Infinity,max = -Infinity;
      for (var i = 0; i < data.length; i++) {
        var {stream = []} = data[i];
        for (var j = 0; j < stream.length; j++) { 
          var value = stream[j][axis]; 
          if(value < min){min = value;}
          if(value > max){max = value;}
        }
      }
      return [min === Infinity?undefined:min,max === -Infinity?undefined:max];
    }
    getLimit(data,X,Y){
      var xLimit = X.labels?[0,X.labels.length - 1]:this.getLimitTypeNumber(data,'x');
      var yLimit = Y.labels?[0,Y.labels.length - 1]:this.getLimitTypeNumber(data,'y');
      return {x:xLimit,y:yLimit};
    }
    getRangeTypeNumber(axis,filter = []){
      var {limit,width,height} = this.details;
      var [min,max] = limit[axis];
      if(min === undefined || max === undefined){return false;}
      var range = max - min,i = 1;
      var start,step,end;
      if(range === 0){
        if(min < 0){start = 2 * min; step = Math.abs(min); end = 0;}
        else if(min > 0){start = 0; step = min; end = 2 * min;}
        else {start = -1; step = 1; end = 1;}
      }
      else{
        while(range / 10 > 1){i *= 10; range /= 10;}
        if(range >= 0 && range <= 3){step = 0.2 * i;}
        else{step = i;}
        start = Math.round(min / step) * step - step;
        end = Math.round(max / step) * step + step;
      }
      var count = (end - start) / step; 
      var size = axis === 'x'?width:height; 
      var maxCount = size?Math.ceil(size / 60):10;
      while (count > maxCount){step *= 2; count = (end - start) / step;}
      var [fs = start,fe = end] = filter;
      var filteredRange = {start,end,step,p1:fs,p2:fe}  
      return {start:fs,step,end:fe,filter:filteredRange}; 
    } 
    getRangeTypeString(axis,{labels,width = 60,height = 30},filter = []){
      var {limit} = this.details;
      var gap = this.getGap(labels);
      var size = this.details[axis === 'x'?'width':'height']
      var [start,end] = limit[axis];
      var fs = filter[0]?labels.indexOf(filter[0]):0;
      var fe = filter[1]?labels.indexOf(filter[1]):labels.length - 1;
      var filteredRange = {start:0,end:labels.length - 1,p1:fs,p2:fe};
      var count = fe - fs + 1;
      var approveCount = Math.floor(size / (axis === 'x'?width:height));
      approveCount = approveCount < 1 ? 1:approveCount;
      var labelStep = Math.floor(count / approveCount);
      labelStep = labelStep < 1 ? 1:labelStep;
      return {
        start:fs - gap,step:labelStep,end:fe + gap,count,filter:filteredRange
      };
    }
    getRange(X,Y){
      var {type} = this.details;
      var {filter} = this.state;
      var xRange = type.x === 'number'?
      this.getRangeTypeNumber('x',filter.x):
      this.getRangeTypeString('x',X,filter.x);
      var yRange = type.y === 'number'?
      this.getRangeTypeNumber('y',filter.y):
      this.getRangeTypeString('y',Y,filter.y);
      return {x:xRange,y:yRange};
    }
    eventHandler(selector, event, action,type = 'bind'){
      var me = { mousedown: "touchstart", mousemove: "touchmove", mouseup: "touchend" }; 
      event = this.touch ? me[event] : event;
      var element = typeof selector === "string"?(selector === "window"?$(window):$(selector)):selector; 
      element.unbind(event, action); 
      if(type === 'bind'){element.bind(event, action)}
    }
    getClient(e){
      return this.touch?{x: e.changedTouches[0].clientX,y:e.changedTouches[0].clientY }:{x:e.clientX,y:e.clientY}
    }
    SetState(obj){this.setState(obj)}
    onChange(data){
      var {onChange} = this.props;
      onChange({data});
    }
    getLineChart({stream,fill = '#fff',color = '#000',pointRadius = 4,lineWidth = 2,area,dash,title,editable},index){ 
      var points = [],line = {points:[],lineWidth,stroke:color,dash},Area;
      for(var j = 0; j < stream.length; j++){
        let {x,y,pointRadius:PointRadius,lineWidth:LineWidth,fill:Fill} = stream[j];  
        if(x === null || y === null){continue;}
        //if(x === 'msf'){debugger;}
        var xp = this.getPercentByValue(x,'x'),yp = this.getPercentByValue(y,'y');
        if(xp === 'string error'){
          console.error(`RChart => Receive "${x}" in data[${index}].stream[${j}].x . but there is not "${x}" in X.labels array`)
          continue;
        }
        else if(xp === 'number error'){
          console.error(`RChart => data[${index}].stream[${j}].x is not a number. if type of x value of stream is an string you must set labels property as array of strings in X props`)
          continue;
        }
        else{xp+='%';}
        if(yp === false){
          console.error(`RChart => Receive "${y}" in data[${index}].stream[${j}].y . but there is not "${y}" in Y.labels array`)
          continue;
        }
        else if(yp === 'number error'){
          console.error(`RChart => data[${index}].stream[${j}].y is not a number. if type of y value of stream is an string you must set labels property as array of strings in Y props`)
          continue;
        }
        else{yp *= -1; yp += '%';}
        var radius = PointRadius || pointRadius;
        if(radius){
          points.push({
            r: radius,lineWidth:LineWidth || lineWidth * 2,x:xp,y:yp,fill:Fill || fill,stroke:color,dataIndex:index,streamIndex:j,value:{x,y},
            event:{mousedown:this.pointMouseDown.bind(this)}
          })
        }
        if(lineWidth){line.points.push([xp,yp]);}
      } 
      if(area){
        Area = {points:line.points.slice(),fill:color,opacity:area};
        Area.points.splice(0,0,[line.points[0][0],0]);
        Area.points.push([line.points[line.points.length - 1][0],0]);
      }
      return {points,line,area:area?Area:[],type:'line',title,index,editable};
    }
    getBarChart({color,title,editable,stream},barCounter,index){
      var rects = [];
      var {barAxis,barCount,barWidth} = this.details;
      for(var j = 0; j < stream.length; j++){
        var {x,y} = stream[j];
        var xp = this.getPercentByValue(x,'x'),yp = this.getPercentByValue(y,'y');
        if(xp === false){
          console.error(`RChart => Receive "${x}" in data[${index}].stream[${j}].x . but there is not "${x}" in X.labels array`)
          continue;
        }
        else{xp+='%';}
        if(yp === false){
          console.error(`RChart => Receive "${y}" in data[${index}].stream[${j}].y . but there is not "${y}" in Y.labels array`)
          continue;
        }
        else{yp *= -1; yp += '%';}
        if(barAxis === 'x'){
          rects.push({
            width:barWidth + '%',height:yp + '%',x:xp,fill:color,
            pivot:[barWidth * (barCount / 2 - barCounter) + '%',0],
            event:{mousedown:this.pointMouseDown.bind(this)},
            dataIndex:index,streamIndex:j
          })
        }
        else{
          rects.push({
            width:xp + '%',height:barWidth + '%',y:yp,fill:color,value:{x,y},
            pivot:[0,barWidth * (barCount / 2 - barCounter) + '%'],
            event:{mousedown:this.pointMouseDown.bind(this)},
            dataIndex:index,streamIndex:j
          })
        }
      }
      return {rects,type:'bar',title,index,editable};
    } 
    getGridLine(value,axis,{color = 'red',lineWidth = 0.7,dash}){
      var range = this.details.range[axis];
      if(!range){return {}}
      var {start,end} = range,v = (value - start) * 100 / (end - start);
      var points = axis === 'x'?[[v + '%','0%'],[v + '%','-100%']]:[['0%',-v + '%'],['100%',-v + '%']];
      return {stroke:color,lineWidth,points,type:'line',dash}
    }
    getGridLines(axis){
      var range = this.details.range[axis];
      if(!range){return []}
      var {start,step,end} = range,{gridColor} = this.props[axis.toUpperCase()];
      var value = Math.round((start - step) / step) * step,gridLines = [];
      while (value <= end) { 
        if(value >= start){gridLines.push(this.getGridLine(value,axis,{color:gridColor}))} 
        value += step;  
      } 
      return gridLines; 
    }
    getElements(){ 
      var points = [],lines = [],rects = [],areas = [],Shapes = []; 
      var {data,X,Y} = this.props;
      var {preventData} = this.state;
      var {barAxis} = this.details;
      var xGridLines = X.gridColor?this.getGridLines('x'):[];
      var yGridLines = Y.gridColor?this.getGridLines('y'):[]; 
      var xIndicator = X.indicator?[this.getGridLine(X.indicator.value,'x',X.indicator)]:[];
      var yIndicator = Y.indicator?[this.getGridLine(Y.indicator.value,'y',X.indicator)]:[];
      var barCounter = 0; 
      this.data = [];
      for(var i = 0; i < data.length; i++){  
        let {title,stream,type:chartType = 'line',color = '#000',shapes} = data[i];
        if(preventData[title]){continue;}
        if(chartType === 'line'){
          var result = this.getLineChart(data[i],i);
          this.data.push(result);
          points = points.concat(result.points); 
          lines = lines.concat(result.line) ; 
          areas = areas.concat(result.area);
        } 
        else if(chartType === 'bar' && barAxis){
          var result = this.getBarChart(data[i],barCounter,i);
          this.data.push(result);
          rects = rects.concat(result.rects);
          barCounter++;
        }
        Shapes = shapes?Shapes.concat(this.getShapes(shapes(data,X,Y))):Shapes; 
      }
      this.elements = {arcs:points,rects};
      return xGridLines.concat(yGridLines,rects,areas,lines,points,xIndicator,yIndicator,Shapes);
    }
    getShapes(shapes){
      var Shapes = [];
      for(var i = 0; i < shapes.length; i++){
        let shape = shapes[i]
        let obj = {...shape};
        if(shape.points){
          obj.points = [];
          for(var j = 0; j < shape.points.length; j++){
            let {x,y} = shape.points[j];
            obj.points.push([this.getPercentByValue(x,'x') + '%',-this.getPercentByValue(y,'y') + '%'])
          }
        }
        else if(shape.r){
          let {x,y} = shape;
          obj.x = this.getPercentByValue(x,'x') + '%';
          obj.y = -this.getPercentByValue(y,'y') + '%';   
        }
        Shapes.push(obj)  
      }
      return Shapes;
    }
    componentDidMount(){this.SetState({})}
    getDetails(){
      var {X,Y,data,barWidth = 80} = this.props,d = this.details; 
      if(!d.type){ 
        d.type = this.getType(X,Y); 
        //تایین محوری که پایه ی بار چارت روی آن بنا می شود
        d.barAxis = d.type.x === 'string'?'x':(d.type.y === 'string'?'y':false);
        //تایین محوری که ادیت چارت در راستای آن انجام می شود
        d.editAxis = d.type.x === 'string'?'y':(d.type.y === 'string'?'x':'y');
        this.getPercentByValue = (value,axis)=>{
          let labels = this.props[axis.toUpperCase()].labels;
          let {start,end} = d.range[axis],Value; 
          if(d.type[axis] === 'number'){
            if(isNaN(value)){return 'number error'}  
            Value = value; 
          }
          else{
            Value = labels.indexOf(value);
            if(Value === -1){return 'string error';}
          }
          return 100 * (Value - start) / (end - start) 
        };
        this.getValueByPercent = (p,axis)=>{
          if(!d.range[axis]){return '';}
          let {start,end} = d.range[axis],Value = (end - start) * p / 100;
          if(d.type[axis] === 'number'){return parseFloat((Value + start).toFixed(this.props.precision))}
          else{
            let labels = this.props[axis.toUpperCase()].labels;
            return labels[Math.round(Value - this.getGap(labels))]
          }
        }
      } //نوع چارت و تابع گرفتن درصد با مقدار یکبار تایین می شود
      if(this.mouseDownDetail.target !== 'point'){this.details.limit = this.getLimit(data,X,Y);}  
      this.details.range = this.getRange(X,Y); 
      d.barCount = data.filter((d)=>d.type === 'bar').length;
      if(d.barAxis){
        d.barWidth = barWidth / d.range[d.barAxis].count/d.barCount;
      }
    }
    getGap(labels){
      return Math.max(0.5,Math.round(labels.length / 10))
    }
    getPixelByValue(value,axis){
      return this.getPercentByValue(value,axis) * this.details[axis === 'x'?'width':'height'] / 100;
    }
    changeFilter(p1,p2,axis){
      var labels = this.props[axis.toUpperCase()].labels; 
      var {filter} = this.state;
      filter[axis] = labels?[labels[p1],labels[p2]]:[p1,p2];
      this.SetState({filter});
    } 
    pointMouseDown({dataIndex,streamIndex}){
      let {data,edit,remove} = this.props;
      if(data[dataIndex].editable === false){return;}
      if(!edit && !remove){return;}
      var stream = data[dataIndex].stream[streamIndex];
      this.mouseDownDetail = {target:'point',x:stream.x,y:stream.y};
      this.eventHandler('window','mousemove',$.proxy(this.pointMouseMove,this))
      this.eventHandler('window','mouseup',$.proxy(this.pointMouseUp,this))
      this.so = {dataIndex,streamIndex,y:this.mouseDetail.y}; 
      this.moved = false;
    }
    pointMouseMove(){
      var {data,edit} = this.props,stream = data[this.so.dataIndex].stream[this.so.streamIndex];
      if(!this.moved){
        if(Math.abs(this.mouseDetail.y - this.so.y) < 8){return;}
        if(stream.y === this.mouseDetail.vy){return;}
      }
      this.moved = true;
      if(!edit){return;}
      edit({dataIndex:this.so.dataIndex,streamIndex:this.so.streamIndex,value:this.mouseDetail.vy});

    }
    pointMouseUp(){
      this.eventHandler('window','mousemove',this.pointMouseMove,'unbind')
      this.eventHandler('window','mouseup',this.pointMouseUp,'unbind');
      this.mouseDownDetail = {};
      var {data,edit,remove,onDragEnd} = this.props;
      if(!this.moved){
        var stream = data[this.so.dataIndex].stream[this.so.streamIndex];
        var title = !edit?this.translate('Remove.Point'):this.translate('Edit.Point');
        this.SetState({
          popup:{
            dataIndex:this.so.dataIndex,streamIndex:this.so.streamIndex,
            dataIndexes:[this.so.dataIndex],
            dynamicValue:stream.y,staticValue:this.mouseDetail.vx,
            onEdit:edit,onRemove:remove,title
          }
        })
      }
      else if(onDragEnd){
        var changes = {dataIndex:this.so.dataIndex,streamIndex:this.so.streamIndex,value:this.mouseDetail.vy};
        onDragEnd(changes)
      }
      else if(edit){
        var changes = {dataIndex:this.so.dataIndex,streamIndex:this.so.streamIndex,value:this.mouseDetail.vy};
        edit(changes)
      }
    }
    //کلیک روی بک گراند چارت
    mouseDown(){
      var {add,multiselect,addPopup} = this.props;
      // اگر مد افزودن فعال بود و در موقعیت فعلی موس دیتا یا دیتا هایی آمادگی دریافت نقطه جدید در این موقعیت را داشتند
      if(add && this.mouseDetail.addDataIndexes.length){
        if(addPopup === false){
          add({
            y:this.mouseDetail.vy,
            x:this.mouseDetail.vx,
          })
        } 
        else{
          this.SetState({
            popup:{
              type:'add',
              dataIndexes:this.mouseDetail.addDataIndexes,
              dataIndex:this.mouseDetail.addDataIndexes[0],
              dynamicValue:this.mouseDetail.vy,
              staticValue:this.mouseDetail.vx,
              onAdd:add,title:this.translate('Add.Point'),
            }
          })
        } 
      }
      else if(multiselect){
        this.multiselect = {};
        this.multiselect.selectRect = $(this.dom.current).find('.r-chart-multiselect');
        this.multiselect.selectRect.css({display:'block',left:this.mouseDetail.px + '%',width:'0%'})
        this.eventHandler('window','mousemove',$.proxy(this.multiselectMove,this));
        this.eventHandler('window','mouseup',$.proxy(this.multiselectUp,this));
        this.multiselect.position = this.mouseDetail.px;
      }
    }
    multiselectMove(){
      var m = this.multiselect,mp = this.mouseDetail.px;
      if(mp < m.position){m.end = m.position; m.start = mp;}
      else{m.start = m.position; m.end = mp;}
      m.selectRect.css({width:(m.end - m.start) + '%',left:m.start + '%'})
    }
    hideSelectRect(){
      if(!this.multiselect || !this.multiselect.selectRect){return;}
      this.multiselect.selectRect.css({display:'none'});
    }
    multiselectUp(){
      var {multiselect} = this.props;
      this.eventHandler('window','mousemove',this.multiselectMove,'unbind');
      this.eventHandler('window','mouseup',this.multiselectUp,'unbind');
      if(!this.multiselect.start || !this.multiselect.end || 
      Math.abs(this.multiselect.start - this.multiselect.end) < 3) {this.hideSelectRect(); return;}
      this.multiselect.points = this.getPointsBySelectRect();
      if(this.multiselect.points.length === 0){
        this.hideSelectRect();
        return;
      } 
      this.SetState({ 
        popup:{
          type:'multiselect',
          title:'Multi Select',
          points:this.multiselect.points 
        }
      })
    }
    getPointsBySelectRect(){
      var {preventData} = this.state;
      var {start,end} = this.multiselect;
      var result = [];
      for(var i = 0; i < this.data.length; i++){
        var {index,title,points,editable} = this.data[i];
        if(editable === false){continue;}
        if(preventData[title]){continue}
        for(var j = 0; j < points.length; j++){
          var x = parseFloat(points[j].x);
          if(x < start || x > end){continue;}
          result.push([index,j])
        }
      }
      return result;
    }
    closePopup(){
      this.SetState({popup:false})
      this.hideSelectRect();
    }
    zoomHover(e,axis){
      e.stopPropagation();
      var {X = {},Y = {}} = this.props;
      if(axis === 'x' && !X.zoom){return;}
      if(axis === 'y' && !Y.zoom){return;}
      this.hoverAxis = axis;
      if(this.zoomDown){return;}
      this.hadleShowSliders(axis)
    }
    zoomMouseDown(){
      this.zoomDown = true;
    }
    zoomMouseUp(){
      this.zoomDown = false;
      if(this.hoverAxis){return;}
      this.hadleShowSliders(false)
    }
    hadleShowSliders(axis){
      if(axis){ 
        var container = $(this.dom.current).find('.r-chart-axis-' + axis);
        var filterSlider = container.find('.filterSlider');
        var labelSlider = container.find('.labelSlider');
        filterSlider.show();
        labelSlider.hide();
      }
      else{
        var container = $(this.dom.current);
        var filterSlider = container.find('.filterSlider');
        var labelSlider = container.find('.labelSlider');
        filterSlider.hide();
        labelSlider.show(); 
      }
    }
    getPopup(popup){
      var d = this.details;
      return <RChartEdit {...popup} 
        onChange={(obj)=>{
          for(let prop in obj){popup[prop] = obj[prop]}
          this.SetState({popup});
        }}
        onClose={this.closePopup.bind(this)} 
      />
    }
    getHeader(yWidth){
      var {data} = this.props,{preventData} = this.state;
      return (
        <div className='r-chart-title' style={{paddingLeft:yWidth + 'px'}}>
            {data.filter((d)=>d.title !== undefined).map((d,i)=>{
              let {color,title} = d;
              let style = !preventData[d.title]?{background:color}:{boxShadow:`inset 0 0 0 2px ${color}`};
              return (
                <div key={i} className='r-chart-title-item' onClick={()=>{
                  preventData[title] = preventData[title] === undefined?false:preventData[title];
                  preventData[title] = !preventData[title];
                  this.SetState({preventData})
                }}>
                  <div className='r-chart-title-color' style={style}></div>
                  <div className='r-chart-title-text'>{d.title || 'untitle'}</div>
                </div>
              )
            })}
          </div>
      )
    }
    getLabelSlider(axis){
      var type = this.details.type[axis],{start,end,step} = this.details.range[axis]; 
      var labelStyle = {x:{top:'24px'},y:{left:'unset',right:'16px',justifyContent:'flex-end'}};
      var {rotate = 0,labels,editLabel} = this.props[axis.toUpperCase()];
      return (
        <RSlider 
          className='labelSlider' editable={false} showValue={false}
          style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',padding:0}}
          pointStyle={{display:'none'}} lineStyle={{display:'none'}}
          direction={axis === 'x'?'right':'top'} start={start} end={end}
          label={{
            step,rotate:axis === 'y'?0:rotate,
            edit:type === 'string'?((value)=>editLabel?editLabel(labels[value]):labels[value]):undefined,
            style:{fontSize:'inherit',...labelStyle[axis]}
          }}
        />
      ) 
    }
    getFilterSlider(axis){  
      var {labels} = this.props[axis.toUpperCase()]; 
      var type = this.details.type[axis],{p1,p2,start,end} = this.details.range[axis].filter;
      var points = [{value:p1},{value:p2,fillStyle:{[axis === 'y'?'width':'height']:'3px',background:'#eee'}}]
      var style = {
        x:{width:'100%',height:'36px',padding:'0 12px',top:0},
        y:{width:'36px',height:'100%',padding:'12px 0',right:0}
      } 
      return (
        <RSlider direction={axis === 'x'?'right':'top'} start={start} end={end} className='filterSlider'
          points={points}
          editValue={(point)=>type === 'string'?labels[point.value]:point.value} 
          ondrag={({points})=>this.changeFilter(points[0].value,points[1].value,axis)}
          onmousedown={this.zoomMouseDown.bind(this)} 
          onmouseup={this.zoomMouseUp.bind(this)}
          style={{position:'absolute',display:'none',...style[axis]}}
          lineStyle={{display:'none'}}
          pointStyle={{width:'16px',height:'16px',borderRadius:'100%',background:'#fff',border:'3px solid #eee'}}
          showValue={true}
        />
      )
    }
    getStreamIndexByLabel({stream},label){
      for(let j = 0; j < stream.length; j++){if(stream[j].x === label){return j}}
      return false;
    }
    getAddableDataIndexes(label){
      if(label === undefined){return []}
      var {data} = this.props;
      var indexes = [];
      for(var i = 0; i < data.length; i++){
        var {editable} = data[i];
        if(editable === false){continue;}
        if(this.getStreamIndexByLabel(data[i],label) === false){
          indexes.push(i);
        }
      }
      return indexes;
    }
    getNearestPointToMouse(vx,vy){
      var {data} = this.props;
      var res = false;
      var dif = Infinity;
      for(var dataIndex = 0; dataIndex < data.length; dataIndex++){
        var streamIndex = this.getStreamIndexByLabel(data[dataIndex],vx);
        if(streamIndex === false){continue;}
        var stream = data[dataIndex].stream[streamIndex];
        var Dif = Math.abs(stream.y - vy);
        if(Dif <= dif){
          res = {vx:stream.x,vy:stream.y,dataIndex,streamIndex};
          dif = Dif;
        }
      }
      return res;
    }
    getMouseDetail([x,y,px,py]){
        var {add,Y} = this.props;
        var {width:yWidth = 50} = Y;
        var vx = this.mouseDownDetail.target === 'point'?this.mouseDownDetail.x:this.getValueByPercent(px,'x');
        var vy = this.getValueByPercent(-py,'y');
        var popupPosition = {x:x + yWidth,y:y + this.details.height}; 
        var nearestPoint = this.getNearestPointToMouse(vx,vy);
        var addDataIndexes = add && this.mouseDownDetail.target !== 'point'?this.getAddableDataIndexes(vx):[];
        this.mouseDetail = {x,y,px,py,vx,vy,nearestPoint,addDataIndexes,popupPosition}
    }
    render(){
      var {X,Y,data,html,add,edit,multiselect,style,rtl} = this.props;  
      var {popup} = this.state; 
      var {height:xHeight = 50} = X;
      var {width:yWidth = 50} = Y;
      this.getDetails();
      var d = this.details;
      var xRange = d.range.x,yRange = d.range.y;
      var items = d.width?this.getElements():[];
      return (
        <RChartContext.Provider value={{data,X,Y,multiselect,translate:this.translate.bind(this),rtl}}>
          <div className='r-chart' ref={this.dom} style={style}>
            {this.getHeader(yWidth)}
            <div className='r-chart-container' style={this.getStyle(yWidth,xHeight)}>
              <div className={'r-chart-popup-container' + (add?' r-chart-add-popup':'')}></div>
              {popup !== false && this.getPopup(popup)}
              <div className='r-chart-axis r-chart-axis-y' 
                onMouseEnter={(e)=>{this.zoomHover(e,'y')}} onMouseLeave={(e)=>{this.zoomHover(e,false)}}> 
                {Y.show !== false && yRange && this.getLabelSlider('y')} 
                {Y.zoom && yRange && this.getFilterSlider('y')}
              </div> 
              <div className='r-chart-canvas'>
                {html && html(this.elements,d)} 
                <div className='r-chart-multiselect'></div>
                <RCanvas 
                  getSize={(width,height)=>{this.details.width = width; this.details.height = height;}} 
                  axisPosition={['0%','100%']}
                  items={items}
                  mouseMove={(e,pos)=>{
                    this.getMouseDetail(pos);
                    var {x,y,px,py,vx,vy,nearestPoint,addDataIndexes,popupPosition} = this.mouseDetail;
                    
                    var addIndicator = '';
                    var container = $(this.dom.current).find('.r-chart-popup-container');
                    
                    if(addDataIndexes.length){
                        addIndicator = addDataIndexes.length?`<div class="add-indicator" style="background:${data[addDataIndexes[0]].color}">+</div>`:''
                        container.css({left:popupPosition.x,top:popupPosition.y});
                        container.html('<div class="r-chart-popup">' + addIndicator + vx  + '  ' + vy + '</div>');
                    }
                    else{
                      if(nearestPoint){
                        let left = this.getPercentByValue(nearestPoint.vx,'x') * d.width / 100 + yWidth;
                        let bottom = this.getPercentByValue(nearestPoint.vy,'y') * d.height / 100 + xHeight;
                        container.css({left,top:'unset',bottom});
                        container.html('<div class="r-chart-popup">' + nearestPoint.vx  + '  ' + nearestPoint.vy + '</div>');
                      }
                      else{
                        //$('.r-chart-popup-container').html('');
                      }
                    }
                  }}
                  mouseDown={this.mouseDown.bind(this)}
                />
              </div>
              <div className='r-chart-corner'></div>
              <div className='r-chart-axis r-chart-axis-x' onMouseEnter={(e)=>{this.zoomHover(e,'x')}} onMouseLeave={(e)=>{this.zoomHover(e,false)}}>
                {X.show !== false && xRange && this.getLabelSlider('x')}
                {X.zoom && xRange && this.getFilterSlider('x')}
              </div>  
            </div>
          </div>
        </RChartContext.Provider>
      )
    }
  }
 RChart.defaultProps = {data:[],X:{},Y:{},filter:{x:[],y:[]},globalization:'en',precision:0}

 class RChartEdit extends Component{
   static contextType = RChartContext;
   constructor(props){
     super(props);
     this.dom = createRef();
   }
   binerySearch(array,value,field){
    var sI = 0,eI = array.length - 1;
    while(eI - sI > 1){
      var midIndex = Math.floor((eI + sI) / 2);
      var midValue = field(array[midIndex],array);
      if(value === midValue){return midIndex;}
      if(value < midValue){eI = midIndex;}
      if(value > midValue){sI = midIndex;}
    }
    var endValue = field(array[eI],array);
    var startValue = field(array[sI],array);
    if(value === endValue){return eI}
    if(value === startValue){return sI}
    if(value > endValue){return Infinity}
    if(value < startValue){return -Infinity}
    return [sI,eI];
  }
  componentDidMount(){
    $(this.dom.current).find('input').eq(0).focus().select();
  }
   render(){
     var {points,type,title,onChange,onClose,onAdd,onEdit,onRemove,dataIndex,streamIndex,dynamicValue,staticValue,dataIndexes = []} = this.props;
     var {data,X,Y,multiselect = {},translate,rtl} = this.context;
     var {items = [],actions = []} = multiselect;
     return (
       <div className='r-chart-edit' ref={this.dom} style={{direction:rtl?'rtl':'ltr'}}>
          <div className='r-chart-edit-backdrop'></div>
          <div className='r-chart-edit-header'>
            <div className='r-chart-edit-title'>{title}</div>
            <div className='r-chart-edit-close' onClick={onClose}></div>
          </div>
          <div className='r-chart-edit-body'>
            <div className='r-chart-edit-data-list'>
              {
                dataIndexes.map((index)=>{
                  if(data[index].editable === false){return false;}
                  return (
                    <div 
                      onClick={()=>onChange({dataIndex:index})}
                      className={`r-chart-edit-data-list-item${dataIndex === index?' active':''}`} 
                      key={index} 
                      style={{color:data[index].color,background:data[index].color}} 
                    ></div>
                  )
                }).filter((d)=>d !== false)
              }
            </div>
            {
              staticValue !== undefined &&
              <div className='r-chart-edit-form'>
                <div className="r-chart-edit-label">{(X.title || 'X untitle') + ' : '}</div>
                <div className="r-chart-detail-value">{staticValue}</div>
              </div>
            }
            {
              dynamicValue !== undefined &&
              <div className='r-chart-edit-form'>
                <div className="r-chart-edit-label">{(Y.title || 'Y untitle') + ' : '}</div>
                <input 
                  className='r-chart-edit-value' type='number' value={dynamicValue} 
                  onChange={(e)=>{
                    if(!onEdit && !onAdd){return;}
                    onChange({dynamicValue:e.target.value})
                  }}
                />
              </div>
            }
            {
              type === 'multiselect' &&
              items.filter((item)=>item.show !== false).map((item,i)=>{
                return ( 
                  <div key={i} className='r-chart-edit-form'>
                    <div className="r-chart-edit-label">{item.title}</div> 
                    {
                      item.type === 'number' &&
                      <input className='r-chart-edit-value' type='number' value={item.value} onChange={(e)=>{
                        let value = parseFloat(e.target.value);
                        item.onChange(value)
                      }}/>      
                    }
                    {
                      item.type === 'select' && 
                      <select  
                        className='r-chart-edit-value' 
                        title={item.value}
                        onChange={({nativeEvent})=>{
                          var {selectedIndex,options} = nativeEvent.target;
                          var {text,value} = options[selectedIndex];
                          item.onChange({index:selectedIndex,text,value})
                        }} 
                        defaultValue={item.value}>
                        {item.options.map((o,i)=><option key={i} value={o.value}>{o.text}</option>)}
                      </select>        
                    } 
                    {
                      item.type === 'checkbox' &&
                      <input type='checkbox' value={item.value} onChange={(e)=>item.onChange(e.target.checked)}/>
                    }
                  </div>      
                )
              })
            }
          </div> 
          <div className='r-chart-edit-footer'>
          <button className='r-chart-edit-button' onClick={onClose} style={{flex:1}}>{translate('Close')}</button>
                { type === 'multiselect' &&
                  actions.filter((a)=>a.show !== false).map((a,i)=>{
                    return (
                      <button key={i} 
                        className='r-chart-edit-button' 
                        onClick={()=>{a.callback(points); onClose();}}
                      >{a.text}</button>    
                    )
                  }) 
                }
                {
                  onAdd && 
                  <button 
                    className='r-chart-edit-button' 
                    onClick={()=>{
                      let streamIndex;
                      let stream = data[dataIndex].stream;
                      var index = this.binerySearch(stream,X.labels.indexOf(staticValue),(m)=>X.labels.indexOf(m.x))
                      if(index === Infinity){streamIndex = stream.length;}
                      else if(index === -Infinity){streamIndex = 0;}
                      else if(Array.isArray(index)){streamIndex = index[1];}
                      onAdd({dataIndex,streamIndex,object:{x:staticValue,y:dynamicValue}}); 
                      onClose();
                    }}
                  >{translate('Add')}</button>
                }
                {
                  onRemove &&
                  <button 
                    className='r-chart-edit-button' 
                    onClick={()=>{onRemove({dataIndex,streamIndex}); onClose();}}
                  >{translate('Remove')}</button>
                }
                {
                  onEdit &&
                  <button 
                    className='r-chart-edit-button' 
                    onClick={()=>{onEdit({dataIndex,streamIndex,value:dynamicValue}); onClose();}}
                  >{translate('Edit')}</button>
                } 
            </div>
        </div>
     )
   }
 }