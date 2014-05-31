/*!
 * rssi-heatmap.js - ver 0.1
 * Author : Satoshi MATSUURA
 * License: MIT License
 * Copyright (c) 2012 Nara Institute of Science and Technology (NAIST)
 */

$(document).ready(function() {
    new RssiMap();
});

function RssiMap() {
    // params & local members
    this.url = document.location.protocol + '//' + 
               document.location.hostname + 
               document.location.pathname;

    this.count     = 0;  // simulation time;
    this.rssi      = {}; // rssi data;
    this.heatPlots = {};
    this.rssiColor = {
        '-40' : '#FF0A00',
        '-45' : '#FF1F00',
        '-50' : '#FF6100',
        '-55' : '#F9A900',
        '-60' : '#F8ED00',
        '-65' : '#C7FF01',
        '-70' : '#44D122',
        '-75' : '#00BA57',
        '-80' : '#00E8CD',
        '-85' : '#00E8FF',
        '-90' : '#0095E2',
        '-95' : '#002F9D'
    };

    // setup handler
    var _self = this;
    var initHandler         = function() { _self.init(); };    

    this.setJsonDataHandler = function(obj) { _self.setJsonData(obj); };

    // attach events
    $(document).bind('ajaxComplete', initHandler);

    // init functions
    this.getRssiData();
    //this.init();
    // this.plotGPS();
}

RssiMap.prototype = {
    //------------------------------
    getRssiData : function() {
        var id = document.location.href.match(/\?rssi\=(\d+)/);
        if( id === null ){
            alert('BAD URL: can not process to get experimental data');
            return;
        }

        var data_id = id[1];
        $.getJSON( this.url, 
                   { rssiData : data_id }, 
                   this.setJsonDataHandler
        );
    },

    //------------------------------
    setJsonData : function( obj ) {
        this.rssi = obj;
    },

    //------------------------------
    init: function() {
        var homeLatLng = new google.maps.LatLng(48.8374, 2.1009);
        var myOptions = {
            zoom: 18,
            center: homeLatLng,
            mapTypeId: google.maps.MapTypeId.SATELLITE
        };
        this.map = new google.maps.Map(document.getElementById("map"), myOptions); 

        //this.drawHeatMap();
        this.startHeatMapAnimation();
    },

    //------------------------------
    drawHeatMap: function() {
        for( var i = 0; i < this.rssi.length; i++ ) {
            var color = this.getRssiColor( this.rssi[i].rssi );
            var pos = new google.maps.LatLng( this.rssi[i].lat, this.rssi[i].lon );
            new google.maps.Circle({
                center: pos,
                fillColor: color,
                fillOpacity: 0.2,
                map: this.map,
                radius: 5,
                strokeColor: color,
                strokeOpacity: 0.5,
                strokeWeight: 2
            });
        }
    },

    //------------------------------
    plotHeatMapAt : function(i) {
        if( 0 <= i && i < this.rssi.length ) {
            var color = this.getRssiColor( this.rssi[i].rssi );
            var pos = new google.maps.LatLng( this.rssi[i].lat, this.rssi[i].lon );
            this.heatPlots[this.count] = new google.maps.Circle({
                center: pos,
                fillColor: color,
                fillOpacity: 0.2,
                map: this.map,
                radius: 5,
                strokeColor: color,
                strokeOpacity: 0.5,
                strokeWeight: 2
            });
        }
    },

    //------------------------------
    startHeatMapAnimation : function() {
        this.plotHeatMapAt( this.count );
        this.count++;
        if( this.rssi.length <= this.count ) {
            this.removeAllHeatPlots();
            this.count = 0;
        }
        var _self = this;
        this.timer = setTimeout( function() { _self.startHeatMapAnimation() }, 50 );
    },

    //------------------------------
    removeAllHeatPlots : function() {
        for (var i in this.heatPlots) {
            this.heatPlots[i].setMap(null);
        }
    },

    //------------------------------
    getRssiColor : function( rssi ) {
        var val = parseInt( rssi / 5) * 5;
        return this.rssiColor[ val ];
    }
};


