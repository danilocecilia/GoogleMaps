﻿var map, latitudeCenterPosition, longitudeCenterPosition;
var origins = [];
var destinations = [];
var originsId = [];
var destionationsId = [];
var dirService, dirRenderer;
var routeQuery;
var bounds;
var panning = false;
var dms;
var query;
var highlightedCell;

function loadDefaultMap() {
    var mapProp = {
        center: new google.maps.LatLng(-11.9957012, -55.5338241),
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
}

function loadInstructors() {
    $.ajax({
        url: 'http://177.47.23.157:10009/WebService/Usuario.ashx?Method=GetInstrutores',
        async: false,
        dataType: 'json',
        success: function (data) {
            if (data.length > 0) {
                $.each(data, function (key, value) {
                    var option = $('<option />').val(value.ID).text(value.Nome);
                    $("#ddlInstructors").append(option);
                });
            }
        }
    });

}

function loadDropdownsOrigemDestino() {
    $.ajax({
        url: 'http://177.47.23.157:10009/WebService/GeoPosition.ashx?Method=GetGeoPositionByInstrutorByData&idUsuario=' + $('#ddlInstructors').val() + '&data=' + $('#datepicker').val() + '',
        async: false,
        dataType: 'json',
        success: function (data) {
            if (data.length > 0) {
                $.each(data, function (key, value) {
                    $("#ddlOrigem").append($('<option />').val(value.ID).text(value.ID));
                    $("#ddlDestino").append($('<option />').val(value.ID).text(value.ID));
                });
            }
        }
    });
}

$(function () {
    loadInstructors();

    $('#ddlInstructors').change(function () {
        loadDropdownsOrigemDestino();
    }
    );

    $("#datepicker").datepicker({ dateFormat: 'dd/mm/yy' });

    jQuery(document).on("click", ".button", function (e) {
        e.preventDefault();
        getGeolocation();
    });

    loadDefaultMap();
});

function getOrigigenDestiationArray(obj) {
    var arr = new Array();

    for (var i = 0; i < obj.length; i++) {
        arr.push(obj[i][0]);
    }
    return arr;
}

function createOriginArray(origin, destination) {
    var org = new Array();
    $.ajax({
        url: 'http://177.47.23.157:10009/WebService/GeoPosition.ashx?Method=GetGeoPositionByInstrutorByData',
        async: false,
        data: { idUsuario: $('#ddlInstructors').val(), data: $('#datepicker').val() },
        dataType: 'json',
        success: function (data) {
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].ID >= origin && data[i].ID <= destination) {
                        var array = new Array();
                        var orig = new google.maps.LatLng(data[i].Latitude, data[i].Longitude);
                        array.push(orig, data[i].ID);
                        org.push(array);
                    }
                }
            }
        }
    });
    return org;
}

function createDestinationArray(origin, destination) {
    var dst = new Array();
    var dstIds = new Array();
    $.ajax({
        url: 'http://177.47.23.157:10009/WebService/GeoPosition.ashx?Method=GetGeoPositionByInstrutorByData',
        async: false,
        data: { idUsuario: $('#ddlInstructors').val(), data: $('#datepicker').val() },
        dataType: 'json',
        success: function (data) {
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].ID > origin && data[i].ID <= destination) {
                        var array = new Array();
                        var dest = new google.maps.LatLng(data[i].Latitude, data[i].Longitude);
                        array.push(dest, data[i].ID);
                        dst.push(array);
                    }
                }
            }
        }
    });
    return dst;
}

function calculateDistance(origin, destination) {
    origins = createOriginArray(origin, destination);
    destinations = createDestinationArray(origin, destination);

    query = {
        origins: getOrigigenDestiationArray(origins),
        destinations: getOrigigenDestiationArray(destinations),
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
    };

    createTable();

    dms = new google.maps.DistanceMatrixService();

    dirService = new google.maps.DirectionsService();
    dirRenderer = new google.maps.DirectionsRenderer({ preserveViewport: true });
    dirRenderer.setMap(map);

    google.maps.event.addListener(map, 'idle', function () {
        if (panning) {
            map.fitBounds(bounds);
            panning = false;
        }
    });

    updateMatrix(dms, query);
};

function initialize(turmaCoordinate, userCoordinates, userRoute, turmaRoute) {
    if (userCoordinates.length > 0) {
        latitudeCenterPosition = userCoordinates[1][1];
        longitudeCenterPosition = userCoordinates[1][2];
    }
    else if (turmaCoordinate.length > 0) {
        latitudeCenterPosition = turmaCoordinate[0][1];
        longitudeCenterPosition = turmaCoordinate[0][2];
    }

    var mapOptions = {
        center: new google.maps.LatLng(latitudeCenterPosition, longitudeCenterPosition), zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("googleMap"), mapOptions);

    var userCoordinate = new google.maps.Polyline({
        path: userRoute,
        strokeColor: '#000000',
        strokeOpacity: 0.8,
        strokeWeight: 2
    });
    userCoordinate.setMap(map);

    var infowindow = new google.maps.InfoWindow();

    var marker, i;

    setMarkerAndInfoWindow(map, turmaCoordinate, marker, i, infowindow); //Turmas
    setMarkerAndInfoWindow(map, userCoordinates, marker, i, infowindow, 'http://maps.google.com/mapfiles/kml/pal4/icon57.png'); // User Routes

    calculateDistance($('#ddlOrigem').val(), $('#ddlDestino').val());

    google.maps.event.addListener(map, "click", function (e) {
        //lat and lng is available in e object
        var t = $('#copyTarget').val().concat(' | ' + e.latLng.lat() + ' | ' + e.latLng.lng());
        $('#copyTarget').val(t);
    });
}

function updateMatrix(dms, query) {
    dms.getDistanceMatrix(query, function (response, status) {
        if (status == "OK") {
            populateTable(response.rows);
        }
    }
    );
}

function populateTable(rows) {
    for (var i = 0; i < rows.length; i++) {
        for (var j = 0; j < rows[i].elements.length; j++) {
            var distance = rows[i].elements[j].distance.text;
            var duration = rows[i].elements[j].duration.text;
            var td = document.getElementById('element-' + i + '-' + j);
            td.innerHTML = distance + "<br/>" + duration;
        }
    }
}

function setMarkerAndInfoWindow(map, coordinates, marker, i, infowindow, icon) {
    for (i = 0; i < coordinates.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinates[i][1], coordinates[i][2]),
            icon: icon,
            map: map
        });

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                infowindow.setContent(coordinates[i][0]);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }
}

function getGeolocation() {
    var drop = $('#ddlInstructors').val();
    var date = $('#datepicker').val();
    var userRoute = new Array();
    var arrUserCoor = new Array();
    var arrTrainingCoor = new Array();
    var arrTrainingRoute = new Array();

    getTurmaCoordinates(arrTrainingCoor, arrTrainingRoute);

    getUserCoordinate(arrUserCoor, userRoute);

    initialize(arrTrainingCoor, arrUserCoor, userRoute, arrTrainingRoute);
};

function getTurmaCoordinates(arrTrainingCoor, arrTrainingRoute) {
    var url = "http://177.47.23.157:10009/WebService/Turma.ashx?Method=GetTurmasByInstrutorByData";

    $.ajax({
        url: url,
        async: false,
        data: { idUsuario: $('#ddlInstructors').val(), data: $('#datepicker').val() },
        dataType: 'json',
        success: function (data) {
            if (data.length > 0)
                fillArrayTrainingCoordinates(data, arrTrainingCoor, arrTrainingRoute);
        }
    });
};

function getUserCoordinate(arrUserCoor, userRoute) {
    var url = "http://177.47.23.157:10009/WebService/GeoPosition.ashx?Method=GetGeoPositionByInstrutorByData";

    $.ajax({
        url: url,
        data: { idUsuario: $('#ddlInstructors').val(), data: $('#datepicker').val() },
        async: false,
        dataType: 'json',
        success: function (data) {
            if (data.length > 0)
                fillArrayUserCoordinates(data, arrUserCoor, userRoute);
        }
    });
};

function fillArrayTrainingCoordinates(data, arrTrainingCoor, arrTrainingRoute) {
    $.each(data, function (key, value) {
        $.map(value.Lojas, function (val, i) {
            var turmaArray = new Array();

            var info = '<div id="content">' +
                         '<div>' +
                             '</div>' +
                                 '<h2 id="firstHeading">' + key + '</h2>' +
                                 '<div id="bodyContent">' +
                                     '<p><b>Turma:</b> ' + value.Codigo +
                                     '<p><b>Loja:</b> ' + (value.Lojas.length > 0 ? value.Lojas[0].Nome : " - ") +
                                     '<p><b>Instrutor:</b> ' + value.Instrutor.Nome +
                                     '<p><b>Data Inicio Treinamento:</b> ' + value.Inicio +
                                     '<p><b>Data Fim Treinamento:</b> ' + value.Termino +
                                     '<p><b>Status:</b> ' + value.Status +
                                 '</div>' +
                             '</div>' +
                         '</div>' +
                    '</div>';

            turmaArray.push(info, val.Latitude, val.Longitude);

            arrTrainingCoor.push(turmaArray);

            var point = new google.maps.LatLng(val.Latitude, val.Longitude);

            arrTrainingRoute.push(point);
        });
    });
};

function fillArrayUserCoordinates(data, arrUserCoor, userRoute) {
    $.each(data, function (key, value) {
        newArray = new Array();

        var info = '<div id="content">' +
                         '<div>' +
                             '</div>' +
                                 '<h2 id="firstHeading">' + value.ID + '</h2>' +
                                 '<div id="bodyContent">' +
                                     '<p><b>User:</b> ' + value.Usuario +
                                     '<p><b>Latitute:</b> ' + value.Latitude +
                                     '<p><b>Longitude:</b> ' + value.Longitude +
                                     '<p><b>Date:</b> ' + value.Data +
                                 '</div>' +
                             '</div>' +
                         '</div>' +
                    '</div>';

        newArray.push(info, value.Latitude, value.Longitude);

        arrUserCoor.push(newArray);

        var point = new google.maps.LatLng(value.Latitude, value.Longitude);

        userRoute.push(point);
    });
}

function createTable() {
    var table = document.getElementById('matrix');
    table.innerHTML = '';

    var tr = addRow(table);
    addElement(tr);
    for (var j = 0; j < destinations.length; j++) {
        var td = addElement(tr);
        td.setAttribute("class", "destination");
        td.appendChild(document.createTextNode(destinations[j][1]));
    }

    for (var i = 0; i < origins.length; i++) {
        var tr = addRow(table);
        var td = addElement(tr);
        td.setAttribute("class", "origin");
        td.appendChild(document.createTextNode(origins[i][1]));
        for (var j = 0; j < destinations.length; j++) {
            var td = addElement(tr, 'element-' + i + '-' + j);
            td.onmouseover = getRouteFunction(i, j);
            td.onclick = getRouteFunction(i, j);
        }
    }
}

function addRow(table) {
    var tr = document.createElement('tr');
    table.appendChild(tr);
    return tr;
}

function addElement(tr, id) {
    var td = document.createElement('td');
    if (id) {
        td.setAttribute('id', id);
    }
    tr.appendChild(td);
    return td;
}

function getRouteFunction(i, j) {
    return function () {
        routeQuery = {
            origin: origins[i][0],
            destination: destinations[j][0],
            travelMode: query.travelMode,
            unitSystem: query.unitSystem,
        };

        if (highlightedCell) {
            highlightedCell.style.backgroundColor = "#ffffff";
        }
        highlightedCell = document.getElementById('element-' + i + '-' + j);
        highlightedCell.style.backgroundColor = "#e0ffff";
        showRoute();
    }
}

function showRoute() {
    dirService.route(routeQuery, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            dirRenderer.setDirections(result);
            bounds = new google.maps.LatLngBounds();
            bounds.extend(result.routes[0].overview_path[0]);
            var k = result.routes[0].overview_path.length;
            bounds.extend(result.routes[0].overview_path[k - 1]);
            panning = true;
            map.panTo(bounds.getCenter());
        }
    });
}
