/*!
 * data-manager.js - ver 0.3
 * Author : Satoshi MATSUURA
 * License: MIT License
 * Copyright (c) 2012 Nara Institute of Science and Technology (NAIST)
 */
$(function(){
    checkNonConvertedFiles();
    initLiveUpdateOfExp();

    var dropArea = $('#dropArea');
    dropArea.filedrop({
        paramname : 'upload',
        url : './index.cgi',

        uploadFinished : function(i,file,response){
            //$.data(file).addClass('done');
            if( response.status === 'fail' ) {
                alert( response.message );
            }
            else {
                $('#oldData').css( 'visibility', 'visible' );
                addOldXMLData( response.file );
                console.log( response );
            }
        }
    });

});

//----------------------------------------
var checkNonConvertedFiles = function() {
    // check non-converted files
    $.getJSON(
        './index.cgi',
        { 'oldxml' : 'all' },
        function(data) {
            if( data.status === 'ok' ) {
                $('#oldData').css( 'visibility', 'visible' );
                for( var i = 0; i < data.files.length; i++ ) {
                    addOldXMLData( data.files[i] );
                }
            }
        }
    );
};

//----------------------------------------
//$('input').each(function(id, elem){ $(elem).click(function(){ alert( elem.id )}) })
var initLiveUpdateOfExp = function() {
    $('input').each(function(id, elem){ 
        $(elem).bind("input", function(){ 
            console.log( elem.id );
            console.log( elem.value );
            var explanationJSON = TextUtil.encodeJSON(
                { exp_id : elem.id, explanation : elem.value });
            $.post(
                './index.cgi',
                {'explanation' : explanationJSON },
                function( data ) {
                    console.log( data );
                    //if( data.status === 'ok'){
                    //    console.log( 'update SUCCESS' );
                    //}
                    //else {
                    //    alert("fail to update note");
                    //}
                }
            );

        }) 
    });
};

//176     //------------------------------
//177     postNote : function(content) {
//178         this.oldText = content;
//179         var path = location.pathname;
//180         $.post(
//181             path,
//182             {'content' : content},
//183             function(data) {
//184                 if( data.status === 'ok' ) {
//185                 }
//186                 else {
//187                     alert("fail to update note");
//188                 }
//189             }
//190         );
//191     },

//----------------------------------------
var addOldXMLData = function(file) {
    var id = file.replace(/\.xml/, '');
    $('<p id='+ id + '>').appendTo('#oldData').click( convertHandler(file) ).html( file );
};

//----------------------------------------
var convertHandler = function(file) {
    return function() {
        $.getJSON(
            './index.cgi',
            { 'convert' : file },
            function(data) {
                if( data.status === 'ok' ) {
                    alert('SUCCESS: convert');
                    var id = file.replace(/\.xml/, '');
                    $('#' + id).unbind('click').css('text-decoration', 'line-through');
                    console.log( data );
                    var linkElem = '<a href="./?analysis=' + data.exp_id + '">link</a>';
                    var trElem = '<tr class="converted">' + 
                        '<td>' + linkElem + '</td>' +
                        '<td>' + data.exp_id + '</td>' + 
                        '<td>' + data.name + '</td>' + 
                        '<td>' + data.date + '</td>' + 
                        '</tr>';
                    $('#mainTbody').append( trElem );

                }
                else if( data.status === 'fail' ) {
                    alert('FAIL: convert');
                    console.log( data );
                }
                else {
                    alert('unexpected error');
                    console.log( data );
                }
        });
    };
};
 
//----------------------------------------
//             Text Utility
//----------------------------------------
var TextUtil = {
    //------------------------------
    escapeJSON : function( str ) {
        if( typeof str === 'number' ) {
            return str;
        }
        str = str.replace(/((?:\\)+)/g, '$1$1');
        str = str.replace(/\n/g, '\\n');
        str = str.replace(/\"/g, '\\"');
        return str;
    },

    //------------------------------
    // NOTICE: this JSON encode is very Simple
    // you can use only for flat structure
    // like    : { 'name' : 'foo', 'job' : 'bar' }
    // NOT like: { 'abcdef0123' : { 'name' : 'foo', 'job' : 'bar' } }
    //------------------------------
    encodeJSON : function( obj ) {
        var json = "{";
        for(var key in obj) {
            json += '"' + key + '":' + '"' + TextUtil.escapeJSON(obj[key]) + '",';
        }
        json = json.replace(/,$/g, '');
        json += "}";
        return json;
    }
};
