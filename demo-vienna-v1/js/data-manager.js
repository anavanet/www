/*!
 * data-manager.js 
 * Author : Satoshi MATSUURA
 * License: MIT License
 * Copyright (c) 2012 Nara Institute of Science and Technology (NAIST)
 */

$(function(){
    init();

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
var init = function() {
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
                    $('tbody').append( trElem );

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
 
 
