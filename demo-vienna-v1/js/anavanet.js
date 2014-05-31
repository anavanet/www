/*!
 * anavanet.js 
 * Author : Satoshi MATSUURA
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
    this.count          = 0;        // simulation time (counter)
    this.drawTimerID    = 0;        // timerID of setInterval (auto redraw)
    this.autoRedrawMode = false;
    this.loopMode       = true;
    this.textStatusMode = true;

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
    var switchAutoRedrawHandler = function() { _self.switchAutoRedraw(); };
    var startAutoRedrawHandler = function() { _self.startAutoRedraw(); };
    var stopAutoRedrawHandler = function() { _self.stopAutoRedraw(); };
    var drawNextStepHandler     = function() { _self.drawNextStep(); };
    var drawPrevStepHandler     = function() { _self.drawPrevStep(); };
    var checkKeyPressHandler    = function(e) { _self.checkKeyPress(e.keyCode); };

    this.setJsonDataHandler     = function(obj) { _self.setJsonData(obj); };
    this.drawForwardHandler     = function() { _self.drawForward(); };
    this.drawBackwardHandler    = function() { _self.drawBackward(); };

    this.keyPressDispacher = {
        32  : switchAutoRedrawHandler,              //  32 : 'space'
        110 : drawNextStepHandler,                  // 110 : 'n'
        112 : drawPrevStepHandler                   // 112 : 'p'
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

    $(document).bind('ajaxComplete', initMapHandler);
    $(document).bind('ajaxComplete', initInfoAreaHandler);
    //$(document).bind('ajaxComplete', startAutoRedrawHandler);
    $(document).bind('keypress', checkKeyPressHandler);

    //------------------------------
    // init
    this.redrawTextStatusBtn();
    this.redrawLoopModeBtn();
    this.redrawAutoRedrawBtn();
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
        this.startAutoRedraw();
      this.drawExpExplanation();
    },
  
  //------------------------------
  drawExpExplanation : function() {
          console.log( this.exp );
    //      console.log( this.exp.explanation );
    //      console.log( this.exp.data[0].nodes.length );
    //      console.log( this.exp.exp_id );
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
    drawDisplay : function( data, timeDir ) {
        var nodes = data.nodes;
        var links = data.links;
        this.showData( data );
        this.showNodesData( nodes );
        this.showLinksData( links );

        for(var i = 0; i < nodes.length; i++) {
            var node   = nodes[i];
            var marker = this.nodeMarkers[ node.node_id ];
            var currentPos = new google.maps.LatLng( node.lat, node.lng );
            var dir = mapUtil.markerDir({ currentPosition : currentPos, 
                                          previousPossiton : marker.getPosition() });
            if( timeDir === 'backward' ) {
                dir = mapUtil.oppositeDir( dir );
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

            infoSpeedValue.html( sprintf("%3.3f (km/h)", node.speed ) );
            infoLatValue.html( sprintf("%3.7f", node.lat) );
            infoLngValue.html( sprintf("%3.7f", node.lng) );
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
    checkKeyPress : function( keyCode ) {
        if( this.keyPressDispacher[ keyCode ] ) {
            this.keyPressDispacher[ keyCode ].apply();
        }
    },

    //------------------------------
    clickTest : function() {
        //console.log( 'clicked' );

        //var graphCont = $('<div>').addClass('graphContainer');

        //var dataInfo = $('<div></div>').attr('id', 'rtt');
        //dataInfo.addClass('dragGraphArea');
        //dataInfo.draggable();
        //dataInfo.append( graphCont );
        //$('#graphArea').append( dataInfo );

        //Flotr.draw( graphCont[0], [
        //    { data : [[0,0], [1,1], [2,2]] }
        //    ],
        //    { title : "RTT" }
        //    );
    

        //this.goToStart();
        //alert( this.exp.data.length );
    }
};

//------------------------------------------------------------
//                      MAP Utility
//------------------------------------------------------------
var mapUtil = {
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
