/*!
 * anavanet.js
 * Author : Satoshi MATSUURA 
 *        : Manabu TSUKADA
 * License: MIT License
 * Copyright (c) 2012 Nara Institute of Science and Technology (NAIST)
 */

$(document).ready(function() {
                  new AnaVanetMap();
                  });

//------------------------------------------------------------
function AnaVanetMap() {
  //------------------------------
  // load elements
  this.mapElem           = $('#map')[0];   // used for google maps
  this.infoAreaElem      = $('#infoArea');
  this.loopBtnElem       = $('#loopBtn');
  this.textStatusBtnElem = $('#textStatusBtn');
  this.startBtnElem = $('#playBtn');
  this.stopBtnElem = $('#stopBtn');
  this.forwardBtnElem = $('#forwardBtn');
  this.backwardBtnElem = $('#backwardBtn');
  this.exp_typeElem = $('#exp_type');
  this.exp_explanationElem = $('#exp_explanation');
  this.rttBtnElem        = $('#rttBtn');
  this.jitterBtnElem        = $('#jitterBtn');
  this.bandwidthBtnElem        = $('#bandwidthBtn');
  this.reqPDRBtnElem        = $('#reqPDRBtn');
  this.repPDRBtnElem        = $('#repPDRBtn');
  this.removeAllOverlayBtnElem        = $('#removeAllOverlayBtn');
  this.helpMessageModal        = $('#help-message');
  this.progressSlideBar   = $('#slider');
  this.experimentProgress   = $('#exp_progress');
  
  
  //------------------------------
  // params & local members
  this.url = document.location.protocol + '//' +
  document.location.hostname +
  document.location.pathname;
  
  this.mapOption = {
  zoom: 18,
  center: new google.maps.LatLng(48.8374, 2.1009),
  mapTypeId: google.maps.MapTypeId.SATELLITE
  };
  this.nodeMarkers    = {};       // google.maps.Marker of nodes
  this.linkLines      = {};       // google.maps.Polyline of links
  this.nemoCircle     = {};       // google.maps.
  this.exp            = {};       // whole experimental data
  this.graph          = {};       // graphs
  this.count          = 0;        // simulation time (counter)
  this.drawTimerID    = 0;        // timerID of setInterval (auto redraw)
  this.autoRedrawMode = false;
  this.loopMode       = true;
  
  this.textStatusMode = false;
  this.rttGraphMode   = false;
  this.jitterGraphMode   = false;
  this.bandwidthGraphMode   = false;
  this.reqPDRGraphMode   = false;
  this.repPDRGraphMode   = false;
  
  
  //------------------------------
  // setup handler
  var _self = this;
  var clickTestHandler        = function() { _self.clickTest(); };
  // var startAutoRedrawHandler  = function() { _self.startAutoRedraw() };
  // var stopAutoRedrawHandler   = function() { _self.stopAutoRedraw() };
  var initMapHandler          = function() { _self.initMap(); };
  var initInfoAreaHandler     = function() { _self.initInfoArea(); };
  var switchLoopModeHandler   = function() { _self.switchLoopMode(); };
  var switchTextStatusHandler = function() { _self.switchTextStatusMode(); };
  var removeAllOverlayHandler = function() { _self.removeAllOverlayInfo(); };
  var switchRttGraphHandler   = function() { _self.switchRttGraph(); };
  var switchJitterGraphHandler   = function() { _self.switchJitterGraph(); };
  var switchBandwidthGraphHandler   = function() { _self.switchBandwidthGraph(); };
  var switchReqPDRGraphHandler   = function() { _self.switchReqPDRGraph(); };
  var switchRepPDRGraphHandler   = function() { _self.switchRepPDRGraph(); };
  var switchAutoRedrawHandler = function() { _self.switchAutoRedraw(); };
  var startAutoRedrawHandler = function() { _self.startAutoRedraw(); };
  var stopAutoRedrawHandler = function() { _self.stopAutoRedraw(); };
  var drawNextStepHandler     = function() { _self.drawNextStep(); };
  var drawPrevStepHandler     = function() { _self.drawPrevStep(); };
  var checkKeyPressHandler    = function(e) { _self.checkKeyPress(e.keyCode); };
  var showModalHandler    = function() { _self.showModal(); };

  
  this.progressSlideBar.slider({
                               slide: function(event, ui) {                               _self.getProgressSliderBar();
                               }});

  
  this.setJsonDataHandler     = function(obj) { _self.setJsonData(obj); };
  this.drawForwardHandler     = function() { _self.drawForward(); };
  this.drawBackwardHandler    = function() { _self.drawBackward(); };
  
  
  
  this.keyPressDispacher = {
    32  : switchAutoRedrawHandler,              //  32 : 'space'
    110 : drawNextStepHandler,                  // 110 : 'n'
    112 : drawPrevStepHandler,                  // 112 : 'p'
    120 : removeAllOverlayHandler,               // 120 : 'x'
    63 : showModalHandler                       //  62 : '?'
  };
  
  //------------------------------
  // attach events
  $('#map').click( clickTestHandler );
  this.loopBtnElem.click( switchLoopModeHandler );
  this.textStatusBtnElem.click( switchTextStatusHandler );
  this.startBtnElem.click( startAutoRedrawHandler );
  this.stopBtnElem.click( stopAutoRedrawHandler );
  this.forwardBtnElem.click( drawNextStepHandler );
  this.backwardBtnElem.click( drawPrevStepHandler );
  this.rttBtnElem.click( switchRttGraphHandler );
  this.jitterBtnElem.click( switchJitterGraphHandler );
  this.bandwidthBtnElem.click( switchBandwidthGraphHandler );
  this.reqPDRBtnElem.click( switchReqPDRGraphHandler );
  this.repPDRBtnElem.click( switchRepPDRGraphHandler );
  this.removeAllOverlayBtnElem.click( removeAllOverlayHandler );
  
  $(document).bind('ajaxComplete', initMapHandler);
  $(document).bind('ajaxComplete', initInfoAreaHandler);
  //$(document).bind('ajaxComplete', startAutoRedrawHandler);
  $(document).bind('keypress', checkKeyPressHandler);
  
  //------------------------------
  // init
  this.getExpData(); // see above event 'ajaxComplete'
  
}


//------------------------------------------------------------
AnaVanetMap.prototype = {
  //------------------------------
  getExpData : function() {
    var id = document.location.href.match(/\?analysis\=(\d+)/);
    if( id === null ){
      alert('BAD URL: can not process to get experimental data');
      return;
    }
    
    var data_id = id[1];
    $.getJSON( this.url,
              { data : data_id },
              this.setJsonDataHandler
              );
  },
  
  //------------------------------
  setJsonData : function( obj ) {
    this.exp = obj;
  },
  
  //------------------------------/*
  initMap : function() {
    this.mapOption.center = this.getMapCenter();
    var map = new google.maps.Map( this.mapElem, this.mapOption );
    this.map = map;
    this.initNodeLink();
    this.determineExpType();
    this.startAutoRedraw();
    this.redrawLoopModeBtn();
    this.redrawAutoRedrawBtn();
    this.drawExpExplanation();
    this.redrawTextStatusBtn();
    this.redrawRttBtn();
    this.redrawJitterBtn();
    this.redrawBandwidthBtn();
    this.redrawReqPDRBtn();
    this.redrawRepPDRBtn();
  },
  
  //------------------------------
  determineExpType : function() {
    if( this.exp.exp_type == "ICMP"){
      this.rttGraphMode   = true;
      this.reqPDRGraphMode   = true;
      this.repPDRGraphMode   = true;
      
    }else if( this.exp.exp_type == "UDP"){
      this.jitterGraphMode   = true;
      this.bandwidthGraphMode   = true;
      this.reqPDRGraphMode   = true;
      
    }else if( this.exp.exp_type == "TCP"){
      this.bandwidthGraphMode   = true;
    }
  },
  //------------------------------
  drawExpExplanation : function() {
              console.log( this.exp );
    this.exp_typeElem.append( this.exp.exp_type );
    this.exp_typeElem.append( " ("+this.exp.node_num +" nodes)" );
    
    this.exp_explanationElem.append( this.exp.explanation );
    
  },
  //------------------------------
  initInfoArea : function() {
    var firstData = this.exp.data[0];
    
    for( var idx = 0; idx < firstData.nodes.length; idx++ ) {
      var node = firstData.nodes[idx];
      var id = 'info' + node.node_id;
      this.infoAreaElem.prepend( infoAreaUtil.createInfoNode( id ) );
    }
    this.infoAreaElem.prepend( infoAreaUtil.createInfoData( 'infoData' ) );
    
    for( var idx = 0; idx < firstData.links.length; idx++ ) {
      var link = firstData.links[idx];
      var id = 'info' + link.name;
      this.infoAreaElem.append( infoAreaUtil.createInfoLink( id ) );
    }
    
    this.setNodesName( firstData.nodes );
    this.setLinksName( firstData.links );
    this.showData( firstData );
    this.showNodesData( firstData.nodes );
    this.showLinksData( firstData.links );
    this.redrawTextStatusBtn();
    this.initProgressSliderBar();

  },
  
  //------------------------------
  initNodeLink : function() {
    var firstData = this.exp.data[0];
    
    // init nodes
    for( var idx = 0; idx < firstData.nodes.length; idx++ ) {
      var node = firstData.nodes[idx];
      var nodeType = node.name.match(/(?:MR|RSU)/)[0];
      var index = '';
      if( node.name.match(/\d+/) ) {
        index = node.name.match(/\d+/)[0];
      }
      this.nodeMarkers[ node.node_id ]
      = new google.maps.Marker({
                               position : new google.maps.LatLng( node.lat, node.lng ),
                               icon : this.getIcon( nodeType, 'right', index ),
                               map : this.map });
    }
    
    // init links
    for( var idx = 0; idx < firstData.links.length; idx++ ) {
      var link     = firstData.links[idx];
      var srcNode  = DataUtil.getNode( {data : firstData, node_id : link.src} );
      var destNode = DataUtil.getNode( {data : firstData, node_id : link.dest} );
      var pos1 = new google.maps.LatLng( srcNode.lat, srcNode.lng );
      var pos2 = new google.maps.LatLng( destNode.lat, destNode.lng );
      this.linkLines[ link.name ]
      = new google.maps.Polyline({
                                 path: [pos1, pos2],
                                 map : this.map,
                                 strokeColor: "#eeeeee",
                                 strokeOpacity: 0.3,
                                 strokeWeight: 3 });
    }
  },
  
  //------------------------------
  goToStart : function() {
    this.removeAllNemoCircle();
    this.count = 0;
    this.drawDisplay( this.exp.data[ this.count ], 'forward' )
  },
  
  //------------------------------
  getMapCenter : function() {
    var data   = this.exp.data[ this.count ];
    var avgLat = 0;
    var avgLng = 0;
    
    for( var i = 0; i < data.nodes.length; i++ ) {
      var node = data.nodes[i];
      avgLat += parseFloat( node.lat );
      avgLng += parseFloat( node.lng );
    }
    avgLat = avgLat / data.nodes.length;
    avgLng = avgLng / data.nodes.length;
    return new google.maps.LatLng( avgLat, avgLng );
  },
  
  //------------------------------
  getIcon : function( nodeType, dir, index ) {
    var iconType = nodeType;
    if( nodeType === 'MR' ) {
      iconType = dir + iconType + index;
    }
    
    if( Icons[ iconType ] ) {
      return Icons[ iconType ];
    }
    return null;
  },
  
  //------------------------------
  getNodeDir : function( geo ) {
    var dir = 'right';
    var currentLng = geo.currentPosition.lng();
    var prevLng    = geo.previousPossiton.lng();
    if( currentLng - prevLng < 0 ) {
      dir = 'left';
    }
    return dir;
  },

  //------------------------------
  initProgressSliderBar : function() {
    this.progressSlideBar.slider();
    this.progressSlideBar.slider( "option", "max", this.exp.data.length );
  },
  
  //------------------------------
  moveProgressSliderBar : function() {
    this.progressSlideBar.slider();
    this.progressSlideBar.slider( "option", "value", this.count );
    this.experimentProgress.html( this.count + "/" + this.exp.data.length);
  },
  
  //------------------------------
  getProgressSliderBar : function() {
    this.progressSlideBar.slider();
    this.count = this.progressSlideBar.slider( "option", "value" );
    this.drawDisplay( this.exp.data[ this.count ], 'forward' )
  },
    

  //------------------------------
  startAutoRedraw : function() {
    if( this.autoRedrawMode ) {
      return;
    }
    this.autoRedrawMode = true;
    this.drawForward();
    this.drawTimerID = setInterval( this.drawForwardHandler, 200 );
    this.redrawAutoRedrawBtn();
  },
  
  //------------------------------
  stopAutoRedraw : function() {
    this.autoRedrawMode = false;
    clearInterval( this.drawTimerID );
    this.redrawAutoRedrawBtn();
  },
  
  //------------------------------
  switchAutoRedraw : function() {
    if( !this.autoRedrawMode ) {
      this.startAutoRedraw();
    }
    else {
      this.stopAutoRedraw();
    }
  },
  
  //------------------------------
  redrawAutoRedrawBtn : function() {
    if( this.autoRedrawMode ) {
      this.startBtnElem.addClass('disabled');
      this.stopBtnElem.removeClass('disabled');
    }
    else {
      this.startBtnElem.removeClass('disabled');
      this.stopBtnElem.addClass('disabled');
    }
  },
  //------------------------------
  switchTextStatusMode : function() {
    this.textStatusMode = !this.textStatusMode;
    this.redrawTextStatusBtn();
  },
  
  //------------------------------
  redrawTextStatusBtn : function() {
    if( this.textStatusMode ) {
      this.textStatusBtnElem.addClass('disabled');
      $('div.dragInfoArea').css('display', 'block');
    }
    else {
      this.textStatusBtnElem.removeClass('disabled');
      $('div.dragInfoArea').css('display', 'none');
    }
  },
  
  //------------------------------
  switchLoopMode : function() {
    this.loopMode = !this.loopMode;
    this.redrawLoopModeBtn();
  },
  
  //------------------------------
  redrawLoopModeBtn : function() {
    if( this.loopMode ) {
      this.loopBtnElem.addClass('disabled');
    }
    else {
      this.loopBtnElem.removeClass('disabled');
    }
  },
  //------------------------------
  switchRttGraph : function() {
    this.rttGraphMode = !this.rttGraphMode;
    this.redrawRttBtn();
  },
  //------------------------------
  redrawRttBtn : function() {
    var rttGraph = $('#graphRTT');
    
    if( this.rttGraphMode ) {
      // TODO check graph is null or not
      if( rttGraph.length == 0 ) {
        this.rttBtnElem.attr('checked', true);
        this.createRttGraph();
      }
      else {
        rttGraph.css('display', 'block');
      }
    }
    else {
      this.rttBtnElem.attr('checked', false);
      rttGraph.css('display', 'none');
    }
  },
  //------------------------------
  switchJitterGraph : function() {
    this.jitterGraphMode = !this.jitterGraphMode;
    this.redrawJitterBtn();
  },
  //------------------------------
  redrawJitterBtn : function() {
    var jitterGraph = $('#graphJitter');
    if( this.jitterGraphMode ) {
      // TODO check graph is null or not
      if( jitterGraph.length == 0 ) {
        this.jitterBtnElem.attr('checked', true);
        this.createJitterGraph();
      }
      else {
        jitterGraph.css('display', 'block');
      }
    }
    else {
      this.jitterBtnElem.attr('checked', false);
      jitterGraph.css('display', 'none');
    }
  },
  //------------------------------
  switchBandwidthGraph : function() {
    this.bandwidthGraphMode = !this.bandwidthGraphMode;
    this.redrawBandwidthBtn();
  },
  //------------------------------
  redrawBandwidthBtn : function() {
    var bandwidthGraph = $('#graphBandwidth');
    
    if( this.bandwidthGraphMode ) {
      // TODO check graph is null or not
      if( bandwidthGraph.length == 0 ) {
        this.bandwidthBtnElem.attr('checked', true);
        this.createBandwidthGraph();
      }
      else {
        bandwidthGraph.css('display', 'block');
      }
    }
    else {
      this.bandwidthBtnElem.attr('checked', false);
      bandwidthGraph.css('display', 'none');
    }
  },
  //------------------------------
  switchReqPDRGraph : function() {
    this.reqPDRGraphMode = !this.reqPDRGraphMode;
    this.redrawReqPDRBtn();
  },
  //------------------------------
  redrawReqPDRBtn : function() {
    var reqPDRGraph = $('#graphReq_PDR');
    if( this.reqPDRGraphMode ) {
      // TODO check graph is null or not
      if( reqPDRGraph.length == 0 ) {
        this.reqPDRBtnElem.attr('checked', true);
        this.createReqPDRGraph();
      }
      else {
        reqPDRGraph.css('display', 'block');
      }
    }
    else {
      this.reqPDRBtnElem.attr('checked', false);
      reqPDRGraph.css('display', 'none');
    }
  },
  //------------------------------
  switchRepPDRGraph : function() {
    this.repPDRGraphMode = !this.repPDRGraphMode;
    this.redrawRepPDRBtn();
  },
  //------------------------------
  redrawRepPDRBtn : function() {
    var repPDRGraph = $('#graphRes_PDR');
    
    if( this.repPDRGraphMode ) {
      // TODO check graph is null or not
      if( repPDRGraph.length == 0 ) {
        this.repPDRBtnElem.attr('checked', true);
        this.createRepPDRGraph();
      }
      else {
        repPDRGraph.css('display', 'block');
      }
    }
    else {
      this.repPDRBtnElem.attr('checked', false);
      repPDRGraph.css('display', 'none');
    }
  },
  
  //------------------------------
  removeAllOverlayInfo : function() {
    this.textStatusMode = false;
    this.rttGraphMode   = false;
    this.jitterGraphMode   = false;
    this.bandwidthGraphMode   = false;
    this.reqPDRGraphMode   = false;
    this.repPDRGraphMode   = false;
    
    this.redrawTextStatusBtn();
    this.redrawRttBtn();
    this.redrawJitterBtn();
    this.redrawBandwidthBtn();
    this.redrawReqPDRBtn();
    this.redrawRepPDRBtn();
  },
  //------------------------------
  drawNextStep : function() {
    this.stopAutoRedraw();
    this.drawForward();
  },
  
  //------------------------------
  drawPrevStep : function() {
    this.stopAutoRedraw();
    this.drawBackward();
  },
  
  //------------------------------
  drawForward : function() {
    if( this.exp.data.length - 1 <= this.count ) {
      if( this.loopMode ) {
        this.goToStart();
      }
      return;
    }
    this.count++;
    this.drawDisplay( this.exp.data[ this.count ], 'forward' )
  },
  
  //------------------------------
  drawBackward : function() {
    if( this.count <= 0 ) {
      return;
    }
    this.count--;
    this.drawDisplay( this.exp.data[ this.count ], 'backward' )
  },
  
  //------------------------------
  showModal : function() {
    this.helpMessageModal.modal('show');
  },
  
  //------------------------------
  drawDisplay : function( data, timeDir ) {
    var nodes = data.nodes;
    var links = data.links;
    this.showData( data );
    this.showNodesData( nodes );
    this.showLinksData( links );
    
    this.map.setCenter(this.getMapCenter());

    for(var i = 0; i < nodes.length; i++) {
      var node   = nodes[i];
      var marker = this.nodeMarkers[ node.node_id ];
      var currentPos = new google.maps.LatLng( node.lat, node.lng );
      var dir = AnaVanetMapUtil.markerDir({ currentPosition : currentPos,
                                          previousPossiton : marker.getPosition() });
      if( timeDir === 'backward' ) {
        dir = AnaVanetMapUtil.oppositeDir( dir );
      }
      var nodeType = node.name.match(/(?:MR|RSU)/)[0];
      var index = '';
      if( node.name.match(/\d+/) ) {
        index = node.name.match(/\d+/)[0];
      }
      marker.setIcon( this.getIcon( nodeType, dir, index ) );
      marker.setPosition( currentPos );
    }

    this.drawLinks( data );
    if( timeDir === 'forward' ) {
      this.drawNemoCircle( data );
    }
    else if( timeDir === 'backward' ) {
      this.removeNemoCircle( data );
    }
    if( !$.isEmptyObject( this.graph ) ) {
      for( var key in this.graph ) {
        this.graph[key].createGraphAt( this.count );
      }
    }
    this.moveProgressSliderBar();
  },
  
  //------------------------------
  drawLinks : function( data ) {
    for( var i = 0; i < data.links.length; i++ ) {
      var link     = data.links[i];
      var srcNode  = DataUtil.getNode( {data : data, node_id : link.src} );
      var destNode = DataUtil.getNode( {data : data, node_id : link.dest} );
      var pos1 = new google.maps.LatLng( srcNode.lat, srcNode.lng );
      var pos2 = new google.maps.LatLng( destNode.lat, destNode.lng );
      var lineColor   = "#000000";
      var lineOpacity = 0.7;
      var lineWeight  = 3;
      
      if (link.req_pdr == 1.0){
        lineColor  = "#FF0000";
        lineOpacity = 0.8;
        lineWeight = 10;
      }
      else if(link.req_pdr > 0.95)  {
        lineColor  = "#FF0000";
        lineOpacity = 0.7;
        lineWeight = 8;
      }
      else if(link.req_pdr > 0.75)  {
        lineColor  = "#FF5555";
        lineOpacity = 0.6;
        lineWeight = 8;
      }
      else if(link.req_pdr > 0.50)  {
        lineColor  = "#FF9000";
        lineOpacity = 0.4;
        lineWeight = 8;
      }
      else if(link.req_pdr > 0.25) {
        lineColor  = "#FF9000";
        lineOpacity = 0.4;
        lineWeight = 6;
      }
      else if(link.req_pdr > 0.05) {
        lineColor  = "#FF9000";
        lineOpacity = 0.2;
        lineWeight = 4;
      }
      else {
        lineColor = "#eeeeee";
        lineOpacity = 0.1;
      }
      
      this.linkLines[ link.name ].setOptions({
                                             path:          [pos1, pos2],
                                             strokeColor:   lineColor,
                                             strokeOpacity: lineOpacity,
                                             strokeWeight:  lineWeight
                                             });
    }
  },
  
  //------------------------------
  drawNemoCircle : function( data ) {
    if( data.nemo_stat === null ) { return; }
    if( data.nemo_stat == 0 ) { return; }
    
    var pos;
    var nemoColor = { 1 : '#0000FF',
      2 : '#FF0000' };
    for( var i = 0; i < data.nodes.length; i++ ){
      var node = data.nodes[i];
      var nodeType = node.name.match(/(?:MR|RSU)/)[0];
      if( nodeType === 'MR' ) {
        pos = new google.maps.LatLng( node.lat, node.lng );
        break;
      }
    }
    if( pos === undefined ) { return; }
    
    this.nemoCircle[ this.count ] =
    new google.maps.Circle({
                           center: pos,
                           fillColor: nemoColor[ data.nemo_stat ],
                           fillOpacity: 0.2,
                           map: this.map,
                           radius: 5,
                           strokeColor: nemoColor[ data.nemo_stat ],
                           strokeOpacity: 0.5,
                           strokeWeight: 2
                           });
  },
  
  //------------------------------
  removeNemoCircle : function( data ) {
    if( data.nemo_stat === null ) { return; }
    if( data.nemo_stat == 0 ) { return; }
    this.nemoCircle[ this.count ].setMap( null );
  },
  
  //------------------------------
  removeAllNemoCircle : function() {
    for (var i in this.nemoCircle) {
      this.nemoCircle[i].setMap(null);
    }
  },
  
  //------------------------------
  showData : function( data ) {
    var id        = '#infoData';
    var nemoStat  = { 0 : 'Non BU/BA',
      1 : 'Success',
      2 : 'Fail' };
    
    var infoTimeValube     = $( id ).find('.infoTime').children('.infoDataValue');
    var infoJitterValube   = $( id ).find('.infoJitter').children('.infoDataValue');
    var infoBandValue      = $( id ).find('.infoBand').children('.infoDataValue');
    var infoByteValube     = $( id ).find('.infoByte').children('.infoDataValue');
    var infoRttValube      = $( id ).find('.infoRTT').children('.infoDataValue');
    var infoReqPDRValube   = $( id ).find('.infoReqPDR').children('.infoDataValue');
    var infoNemoStatValube = $( id ).find('.infoNEMO').children('.infoDataValue');
    
    infoTimeValube.html( data.time );
    infoJitterValube.html( sprintf("%.3f (ms)", data.jitter) );
    infoBandValue.html( sprintf("%d (kbps)", data.bandwidth / 1000) );
    infoByteValube.html( sprintf("%d (kB)", data.bytes / 1000) );
    infoRttValube.html( sprintf("%d (ms)", data.rtt) );
    infoReqPDRValube.html( sprintf("%.1f (%)", data.req_pdr * 100) );
    infoNemoStatValube.html( nemoStat[ data.nemo_stat ] );
  },
  
  //------------------------------
  showNodesData : function( nodes ) {
    for(var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var id   = '#info' + node.node_id;
      
      var infoSpeedValue = $( id ).find('.infoSpeed').children('.infoDataValue');
      var infoLatValue   = $( id ).find('.infoLat').children('.infoDataValue');
      var infoLngValue   = $( id ).find('.infoLng').children('.infoDataValue');
      var infoCPUValue   = $( id ).find('.infoCPU').children('.infoDataValue');
      var infoMEMValue   = $( id ).find('.infoMEM').children('.infoDataValue');
      
      infoSpeedValue.html( sprintf("%3.3f (km/h)", node.speed ) );
      infoLatValue.html( sprintf("%3.7f", node.lat) );
      infoLngValue.html( sprintf("%3.7f", node.lng) );
      // TODO, if there are no infomation, just 0 
      infoCPUValue.html( sprintf("%3.2f", node.cpuWork? node.cpuWork: 0) );
      infoMEMValue.html( sprintf("%3.2f", node.memFree? node.memFree: 0) );
    }
  },
  
  //------------------------------
  showLinksData : function( links ) {
    for(var i = 0; i < links.length; i++) {
      var link = links[i];
      var id   = '#info' + link.name;
      
      var infoDist   = $( id ).find('.infoDist').children('.infoDataValue');
      var infoReqPDR = $( id ).find('.infoReqPDR').children('.infoDataValue');
      var infoResPDR = $( id ).find('.infoResPDR').children('.infoDataValue');
      
      infoDist.html( '' + sprintf("%.3f (m)", link.distance ) );
      infoReqPDR.html(  sprintf("%.1f (%)", link.req_pdr * 100) );
      infoResPDR.html(  sprintf("%.1f (%)", link.res_pdr * 100) );
    }
  },
  
  //------------------------------
  setNodesName : function( nodes ) {
    for(var i = 0; i < nodes.length; i++) {
      var node   = nodes[i];
      var id     = '#info' + node.node_id;
      var infoNameValue   = $( id ).find('.infoNode').children('.infoDataValue');
      infoNameValue.html( node.name );
    }
  },
  
  //------------------------------
  setLinksName : function( links ) {
    for( var i = 0; i < links.length; i++) {
      var link    = links[i];
      var id      = '#info' + link.name;
      var infoNameValue    = $( id ).find('.infoLink').children('.infoDataValue');
      infoNameValue.html( link.name );
    }
  },
  
  //------------------------------
  drawCircle : function( node ) {
    var pos = new google.maps.LatLng( node.lat, node.lng );
    var color = '#FF0000';
    return new google.maps.Circle({
                                  center: pos,
                                  fillColor: color,
                                  fillOpacity: 0.2,
                                  map: this.map,
                                  radius: 5,
                                  strokeColor: color,
                                  strokeOpacity: 0.5,
                                  strokeWeight: 2
                                  });
  },
  //------------------------------
  createReqPDRGraph : function() {
    var reqPdrData = {};
    var len = this.exp.data.length;
    var linkLen = this.exp.data[0].links.length;
    for( var j = 0; j < linkLen; j++ ) {
      reqPdrData[ this.exp.data[0].links[j].name ] = [];
    }
    
    for( var i = 0; i < len; i++ ) {
      for( var j = 0; j < linkLen; j++ ){
        reqPdrData[ this.exp.data[0].links[j].name ].push(
                                                          [i, this.exp.data[i].links[j].req_pdr] );
      }
    }
    this.graph.req_pdr = new AnaVanetGraph(  {title : 'Req_PDR', plots : reqPdrData } );
    this.graph.req_pdr.createGraphAt( this.count );
  },
  
  //------------------------------
  createRepPDRGraph : function() {
    var resPdrData = {};
    var len = this.exp.data.length;
    var linkLen = this.exp.data[0].links.length;
    for( var j = 0; j < linkLen; j++ ) {
      resPdrData[ this.exp.data[0].links[j].name ] = [];
    }
    
    for( var i = 0; i < len; i++ ) {
      for( var j = 0; j < linkLen; j++ ){
        resPdrData[ this.exp.data[0].links[j].name ].push(
                                                          [i, this.exp.data[i].links[j].res_pdr] );
      }
    }
    this.graph.res_pdr = new AnaVanetGraph(  {title : 'Res_PDR', plots : resPdrData } );
    this.graph.res_pdr.createGraphAt( this.count );
  },
  
  //------------------------------
  createBandwidthGraph : function() {
    var bandwidthData = [];
    var len = this.exp.data.length;
    for( var i = 0; i < len; i++ ) {
      bandwidthData.push([i, this.exp.data[i].bandwidth]);
    }
    this.graph.bandwidth = new AnaVanetGraph(  {title : 'Bandwidth', plots : { bandwidth : bandwidthData} } );
    this.graph.bandwidth.createGraphAt( this.count );
  },
  
  //------------------------------
  createJitterGraph : function() {
    var jitterData = [];
    var len = this.exp.data.length;
    for( var i = 0; i < len; i++ ) {
      jitterData.push([i, this.exp.data[i].jitter]);
    }
    this.graph.jitter = new AnaVanetGraph(  {title : 'Jitter', plots : { jitter : jitterData} } );
    this.graph.jitter.createGraphAt( this.count );
  },
  
  //------------------------------
  createRttGraph : function() {
    var rttData = [];
    var len = this.exp.data.length;
    for( var i = 0; i < len; i++ ) {
      rttData.push([i, this.exp.data[i].rtt]);
    }
    this.graph.rtt = new AnaVanetGraph(  {title : 'RTT', plots : { RTT : rttData} } );
    this.graph.rtt.createGraphAt( this.count );
  },
  
  //------------------------------
  checkKeyPress : function( keyCode ) {
//    console.log( keyCode );
    if( this.keyPressDispacher[ keyCode ] ) {
      this.keyPressDispacher[ keyCode ].apply();
    }
  },
  
  //------------------------------
  clickTest : function() {
    //      console.log( 'clicked' );
    //    this.showModal();
    /*
     if (this.rttBtnElem.attr('checked') ){
     console.log( 'checked, uncheck' );
     this.rttBtnElem.attr('checked', false);
     
     }
     else {
     this.rttBtnElem.check;
     console.log( 'not checked, check' );
     this.rttBtnElem.attr('checked', true);
     }*/
  }
};

//------------------------------------------------------------
//                       AnaVanetGraph
//------------------------------------------------------------
function AnaVanetGraph( data ) {
  // dom elements
  this.graphAreaElem = $('#graphArea');
  
  // params
  this.data = data;
  this.graphCont = null;
  this.colors = ['#00A8F0', '#C0D800', '#CB4B4B', '#4DA74D', '#9440ED'];
  this.formatter = {
    normal    : "%s %s",
    Jitter    : "%s %.3f",
    Bandwidth : "%s %d",
    RTT       : "%s %.2f",
    Req_PDR   : "%s %.2f",
    Res_PDR   : "%s %.2f"
  };
  
}

AnaVanetGraph.prototype = {
  createGraph : function() {
    if( this.graphCont === null ) {
      this.createGraphCont();
    }
    
    var format = this.formatter[ this.data.title ];
    var plotData = [];
    for( var key in this.data.plots ) {
      plotData.push( { data : this.data.plots[key], label : key } );
    }
    
    Flotr.draw(
               this.graphCont[0],
               plotData,
               { title : this.data.title }
               );
  },
  
  //------------------------------
  createGraphAt : function(t) {
    if( this.graphCont === null ) {
      this.createGraphCont();
    }
    
    var format = this.formatter[ this.data.title ];
    var plotData = [];
    var i = 0;
    for( var key in this.data.plots ) {
      var label;
      if( this.data.plots[key][t][1] === null ) {
        label = sprintf(this.formatter.normal, key, this.data.plots[key][t][1]);
      }
      else {
        label = sprintf(format, key, this.data.plots[key][t][1]);
      }
      plotData.push( { data : this.data.plots[key], color : this.colors[i], label : label } );
      plotData.push( { data : [ this.data.plots[key][t] ], color : this.colors[i], points : {show : true} } );
      i++;
    }
    
    Flotr.draw(
               this.graphCont[0],
               plotData,
               { title : this.data.title, legend : {position : 'ne'} }
               );
  },
  
  //------------------------------
  createGraphCont : function() {
    this.graphCont = $('<div>').addClass('graphContainer');
    
    var dataInfo = $('<div></div>').attr('id', 'graph' + this.data.title);
    dataInfo.addClass('dragGraphArea');
    dataInfo.draggable();
    dataInfo.append( this.graphCont );
    this.graphAreaElem.append( dataInfo );
  }
};


//------------------------------------------------------------
//                      MAP Utility
//------------------------------------------------------------
var AnaVanetMapUtil = {
  opDir : {
    'right' : 'left',
    'left'  : 'right'
  },
  
  //------------------------------
  markerDir : function( geo ) {
    var dir = 'right';
    var currentLng = geo.currentPosition.lng();
    var prevLng    = geo.previousPossiton.lng();
    if( currentLng - prevLng < 0 ) {
      dir = 'left';
    }
    return dir;
  },
  
  //------------------------------
  oppositeDir : function( dir ) {
    if( this.opDir[ dir ] ){
      return this.opDir[ dir ];
    }
    return;
  }
};

//------------------------------------------------------------
//                    Data Utility
//------------------------------------------------------------
var DataUtil = {
  //------------------------------
  getNode : function( info ) {
    for( var idx = 0; idx < info.data.nodes.length; idx++ ) {
      if( info.data.nodes[ idx ].node_id === info.node_id ) {
        return info.data.nodes[ idx ];
      }
    }
    return;
  }
  
};

//------------------------------------------------------------
//                    Info Area Utility
//------------------------------------------------------------
var infoAreaUtil = {
  //------------------------------
  createInfoData : function(id) {
    var dataInfo = $('<div></div>').attr('id', id);
    dataInfo.addClass('dragInfoDataArea');
    dataInfo.addClass('dragInfoArea');
    dataInfo.draggable();
    
    dataInfo.append( this.getInfoDataDiv( 'Time' ) );
    dataInfo.append( this.getInfoDataDiv( 'Jitter' ) );
    dataInfo.append( this.getInfoDataDiv( 'Band' ) );
    dataInfo.append( this.getInfoDataDiv( 'Byte' ) );
    dataInfo.append( this.getInfoDataDiv( 'RTT' ) );
    dataInfo.append( this.getInfoDataDiv( 'ReqPDR' ) );
    dataInfo.append( this.getInfoDataDiv( 'NEMO' ) );
    return dataInfo;
  },
  
  //------------------------------
  createInfoNode : function(id) {
    var nodeInfo = $('<div></div>').attr('id', id);
    nodeInfo.addClass('dragInfoNodeArea');
    nodeInfo.addClass('dragInfoArea');
    nodeInfo.draggable();
    
    nodeInfo.append( this.getInfoDataDiv( 'Node' ) );
    nodeInfo.append( this.getInfoDataDiv( 'Speed' ) );
    nodeInfo.append( this.getInfoDataDiv( 'Lat' ) );
    nodeInfo.append( this.getInfoDataDiv( 'Lng' ) );
    nodeInfo.append( this.getInfoDataDiv( 'CPU' ) );
    nodeInfo.append( this.getInfoDataDiv( 'MEM' ) );
    return nodeInfo;
  },
  
  //------------------------------
  createInfoLink : function(id) {
    var linkInfo = $('<div></div>').attr('id', id);
    linkInfo.addClass('dragInfoLinkArea');
    linkInfo.addClass('dragInfoArea');
    linkInfo.draggable();
    
    linkInfo.append( this.getInfoDataDiv( 'Link' ) );
    linkInfo.append( this.getInfoDataDiv( 'Dist' ) );
    linkInfo.append( this.getInfoDataDiv( 'ReqPDR' ) );
    linkInfo.append( this.getInfoDataDiv( 'ResPDR' ) );
    return linkInfo;
  },
  
  //------------------------------
  getInfoDataDiv : function( name ) {
    var infoDiv = $('<div></div>');
    infoDiv.addClass( 'info' + name );
    infoDiv.addClass( 'infoData' );
    
    var infoDataName = $('<div></div>');
    infoDataName.addClass('infoDataName');
    infoDataName.html( name );
    var infoDataValue = $('<div></div>');
    infoDataValue.addClass('infoDataValue');
    
    infoDiv.append( infoDataName );
    infoDiv.append( infoDataValue );
    return infoDiv;
  }
};


//------------------------------------------------------------
//                          Icons
//------------------------------------------------------------
var Icons = {
  RSU : new google.maps.MarkerImage(
                                    "./img/ap.png",
                                    new google.maps.Size(32,32),	//size
                                    new google.maps.Point(0,0),	    //position
                                    new google.maps.Point(16, 32)	//anchor
                                    ),
  leftMR : new google.maps.MarkerImage(
                                       "./img/C3-blue-left3.gif",
                                       new google.maps.Size(66,33),	//size
                                       new google.maps.Point(0,0),	    //position
                                       new google.maps.Point(22, 19)	//anchor
                                       ),
  rightMR : new google.maps.MarkerImage(
                                        "./img/C3-blue-right3.gif",
                                        new google.maps.Size(66,33),	//size
                                        new google.maps.Point(0,0),	    //position
                                        new google.maps.Point(22, 19)	//anchor
                                        ),
  leftMR1 : new google.maps.MarkerImage(
                                        "./img/C3-black-left1.gif",
                                        new google.maps.Size(66,33),	//size
                                        new google.maps.Point(0,0),	    //position
                                        new google.maps.Point(22, 19)	//anchor
                                        ),
  rightMR1 : new google.maps.MarkerImage(
                                         "./img/C3-black-right1.gif",
                                         new google.maps.Size(66,33),	//size
                                         new google.maps.Point(0,0),	    //position
                                         new google.maps.Point(22, 19)	//anchor
                                         ),
  leftMR2 : new google.maps.MarkerImage(
                                        "./img/C3-red-left2.gif",
                                        new google.maps.Size(66,33),	//size
                                        new google.maps.Point(0,0),	    //position
                                        new google.maps.Point(22, 19)	//anchor
                                        ),
  rightMR2 : new google.maps.MarkerImage(
                                         "./img/C3-red-right2.gif",
                                         new google.maps.Size(66,33),	//size
                                         new google.maps.Point(0,0),	    //position
                                         new google.maps.Point(22, 19)	//anchor
                                         ),
  leftMR3 : new google.maps.MarkerImage(
                                        "./img/C3-blue-left3.gif",
                                        new google.maps.Size(66,33),	//size
                                        new google.maps.Point(0,0),	    //position
                                        new google.maps.Point(22, 19)	//anchor
                                        ),
  rightMR3 : new google.maps.MarkerImage(
                                         "./img/C3-blue-right3.gif",
                                         new google.maps.Size(66,33),	//size
                                         new google.maps.Point(0,0),	    //position
                                         new google.maps.Point(22, 19)	//anchor
                                         ),
  leftMR4 : new google.maps.MarkerImage(
                                        "./img/C3-green-left4.gif",
                                        new google.maps.Size(66,33),	//size
                                        new google.maps.Point(0,0),	    //position
                                        new google.maps.Point(22, 19)	//anchor
                                        ),
  rightMR4 : new google.maps.MarkerImage(
                                         "./img/C3-green-right4.gif",
                                         new google.maps.Size(66,33),	//size
                                         new google.maps.Point(0,0),	    //position
                                         new google.maps.Point(22, 19)	//anchor
                                         )
};
