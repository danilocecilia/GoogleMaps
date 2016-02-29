(function () {
    var flickerAPI = "http://177.47.23.157:10009/WebService/Usuario.ashx?Method=GetInstrutores";
    $.getJSON(flickerAPI, {
        tagmode: "any",
        format: "json"
    })
    .done(function (data) {
        $.each(data, function (key, value) {
            var option = $('<option />').val(value.ID).text(value.Nome);
            $("#dropDownDest").append(option);
        });
    });
})();

$(function () {
    $("#datepicker").datepicker({ dateFormat: 'dd/mm/yy' });

    jQuery(document).on("click", ".button", function (e) {
        e.preventDefault();
        getGeolocation();
    });
});

function initialize(turmaCoordinate, userCoordinates, userRoute, turmaRoute) {
    var map, latitudeCenterPosition, longitudeCenterPosition;

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

    google.maps.event.addListener(map, "click", function (e) {

        //lat and lng is available in e object
        var t = $('#copyTarget').val().concat(' | ' + e.latLng.lat() + ' | ' + e.latLng.lng());
        $('#copyTarget').val(t);
    });

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
    var drop = $('#dropDownDest').val();
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
        data: { idUsuario: $('#dropDownDest').val(), data: $('#datepicker').val() },
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
        data: { idUsuario: $('#dropDownDest').val(), data: $('#datepicker').val() },
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
                                 '<h2 id="firstHeading">' + key + '</h2>' +
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