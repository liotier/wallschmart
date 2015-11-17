/* ---------------- */
/*    VARIABLES     */
/* ---------------- */

// copyrights
var copyrights = "DRIEA IF - Direction des routes &icirc;le-de-France (DiRIF) - www.sytadin.fr";
// donn�es indisponibles
var evtsIndispo = "<br />Donn&eacute;es &eacute;v&eacute;nements indisponibles";
var bouchonsIndispo = "Donn&eacute;es bouchons indisponibles";
var vitessesIndispo = "Donn&eacute;es vitesses indisponibles";
// Object synchro donees tps reel
var synchFermetures, synchTpsReel, synchVH = null;
// url tuiles
var urlFond = [domaine1 + "/carto/statique/tms/", domaine2 +"/carto/statique/tms/", domaine3 + "/carto/statique/tms/", domaine4 + "/carto/statique/tms/" ];
// controls
var dateControl, attributionControl;
var joursTab = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
// Pictos
var img_acc = "/resources/images/accident.png";
var img_inc = "/resources/images/incident.png";
var img_trav = "/resources/images/travaux.png";
var img_evt = "/resources/images/evenement_exceptionnel.png";
var img_vd = "/resources/images/vd.png";
var bimg_acc = "/resources/images/accident_big.png";
var bimg_inc = "/resources/images/incident_big.png";
var bimg_trav = "/resources/images/travaux_big.png";
var bimg_evt = "/resources/images/evenement_exceptionnel_big.png";
var bimg_vd = "/resources/images/vd_big.png";
// icones couche evts
var evtsIcons = [img_inc, img_acc, img_trav, img_evt, img_evt, img_evt, img_evt, img_evt, img_evt, img_evt, img_inc, img_inc, img_inc, img_vd];
// icones grand format couche evts
var evtsIconsBig = [bimg_inc,  bimg_acc, bimg_trav, bimg_evt, bimg_evt, bimg_evt, bimg_evt, bimg_evt, bimg_evt, bimg_evt, bimg_inc, bimg_inc, bimg_inc, bimg_vd ];
// styles pictos evts
var evtsStyleMap = new OpenLayers.StyleMap({                
    'default': new OpenLayers.Style({
                  'pointRadius': 10,
                  'externalGraphic': "${getEvtsIcon}"
                }, {context: { getEvtsIcon: function(feature) { return evtsIcons[feature.attributes["type"]]; } }}),
    'select': new OpenLayers.Style({
                  'pointRadius': 15,
                  'externalGraphic': "${getEvtsIconBig}"
                }, {context: { getEvtsIconBig: function(feature) { return evtsIconsBig[feature.attributes["type"]]; } }})
});
// popup close
var selectedFeature;
// map
var map;
// layers
var bouchons, vitesses, activeLayer, oldLayer, jourPourFermeture, vh;
// id timer rafraichissement
var idTimerR;
// periode rafraichissement
var timerR = 60;
//etat degrade / normal
isDegradedMode = null;
oldIsDegradedMode = null;
var timerCarto = null;
var locateMe = false;

/* ---------------- */
/* FONCTIONS */
/* ---------------- */

// callback fermeture popup
function onPopupClose(evt) {
  ctrls.unselect(selectedFeature);
}

// fermeture popup
function onFeatureUnselect(feature) {
  if(feature != null) {
    map.removePopup(feature.popup);
    feature.popup.destroy();
    feature.popup = null;
  }
  selectedFeature = null;
}  

// selection feature
function onFeatureSelect(feature) {
  // fermeture du precedent popup
  onFeatureUnselect(selectedFeature);
  selectedFeature = feature;

  // parsing tooltip
  exp = feature.attributes.info.split("\n");
  tooltip = "";
  
  for(idx in exp) {
    str = exp[idx].trim();
    if(idx == 0 && str.length != 0) {
      tooltip = "<b>" + exp[idx].trim() + "</b>"; 
    } else if(str.length != 0){
      tooltip = tooltip + "<br />" + exp[idx].trim();
    }
  }

  // affichage popup
  popup = new OpenLayers.Popup.FramedCloud("tooltip",
                           feature.geometry.getBounds().getCenterLonLat(),
                           null,
                           tooltip,
                           null, true, onPopupClose);
  feature.popup = popup;
  popup.feature = feature;
  map.addPopup(popup);
}


// retour vue principale
function gotoInitialView() {
  map.zoomToMaxExtent();
  map.setCenter(new OpenLayers.LonLat(600000.0,2429000.0),0,false,false);
}


// MAJ carte sur resize
function updateMap()
{
  if(typeof(map) != undefined) {
    map.updateSize();  
  }
}


// Seulement layers BOUCHONS, VITESSES, FERMETURES
function switchMap(name, j){

  //on affecte journne pour l'avoir pour le passage en degrade
  jourPourFermeture = j;
  if(oldLayer != (name+j)) {
    oldLayer = name + j;
    switchLayerVisibility(activeLayer, false);
  
    if(name == "bouchons" || name == "vitesses" || name == "vh") {
      switchLayerVisibility(name, true);
      switchLayerVisibility("evenements", true);
      activeLayer = name;
      updateDateCarte();
      
    } else if(name == "fermetures") { 
    	
      activeLayer = name;
      if(selectedFeature != null) {
        ctrls.unselect(selectedFeature);
      }
   
      switchLayerVisibility("evenements", false);
      if(typeof(synchFermetures) == 'undefined') {
        synchronize("cartoFermetures");
      }
        
      setDateFermetures(j);    
      // synchronisation des cartes
      urlFermetures = [
          domaine1 + "/carto/fermetures/" + synchFermetures.dossier + "/" + synchFermetures.dates_fermetures[j] + "/tms/", 
          domaine2 + "/carto/fermetures/" + synchFermetures.dossier + "/" + synchFermetures.dates_fermetures[j] + "/tms/", 
          domaine3 + "/carto/fermetures/" + synchFermetures.dossier + "/" + synchFermetures.dates_fermetures[j] + "/tms/", 
          domaine4 + "/carto/fermetures/" + synchFermetures.dossier + "/" + synchFermetures.dates_fermetures[j] + "/tms/"
      ];
      
      fermetures.setUrl(urlFermetures);       
      switchLayerVisibility(name, true);   
    }
  }
}



// Gestion affichage layers
function switchLayerVisibility(name, visibility){
	
	if(name == "vh") {
		if(visibility) {
			ajouterLayerVH();
		} else {
			supprimerLayerVH();
		}
	} else {
		layers = map.getLayersBy("layername", name);
	
		for(var i=0 ; i<layers.length ; i++)
		{
			layers[i].setVisibility(visibility);
		}
	}
}

function ajouterLayerVH() {
	
	synchronize("cartoVh");
	
	// synchTpsReel des cartes
	urlVH = [
			domaine1 + "/carto/vh/" + synchVH.dossier + "/tms/",
			domaine2 + "/carto/vh/" + synchVH.dossier + "/tms/",
			domaine3 + "/carto/vh/" + synchVH.dossier + "/tms/",
			domaine4 + "/carto/vh/" + synchVH.dossier + "/tms/" ];

	// Couche TMS synoptique bouchons
	vh = new OpenLayers.Layer.TMS("TMS - vh", urlVH, {
		layername : "vh",
		serverResolutions: [ 100 ],
		type : 'png',
		isBaseLayer : false,
		visibility : true,
		buffer : 0,
		attribution : copyrights,
		removeBackBufferDelay: 0,
        transitionEffect: null
	});

	map.addLayer(vh);
	map.zoomTo(0);
	
}

function supprimerLayerVH() {
	if(map.getLayersBy("layername", "vh").length != 0) {
		map.removeLayer(vh);
	}	
}


function checkDate(i)
{
  if (i<10) 
  {
    i="0" + i;
  }
  return i;
}

function getDateFermetures(dateFermetures, dateProduction) {

  dateF = new Date(parseInt(dateFermetures.toString().substr(0,4),10),parseInt(dateFermetures.toString().substr(4,2),10)-1,parseInt(dateFermetures.toString().substr(6,2),10),1,0,0,0);
  dateP = new Date(dateProduction*1000);
  dateTextF = "Fermetures le " + joursTab[dateF.getDay()] + " " + checkDate(dateF.getDate()) + "/" + checkDate(dateF.getMonth()+1) + "/" + dateF.getFullYear();
  dateTextP = " (donn&eacute;es actualis&eacute;es le " + checkDate(dateP.getDate()) + "/" + checkDate(dateP.getMonth()+1) + "/" + dateP.getFullYear() + " &agrave; " + checkDate(dateP.getHours()) + ":" + checkDate(dateP.getMinutes()) + ")";
  return dateTextF + "<br />" + dateTextP;
}

function setDateFermetures(journee) {

  etatFermetures = getDateFermetures(synchFermetures.dates_fermetures[journee], parseInt(synchFermetures.date_production,10));
  dateControl.div.innerHTML=etatFermetures;

}



function getDateCarte(dateCarte) {

  var date = new Date(dateCarte*1000);
  var entete = "";
  
  if(activeLayer == "bouchons") {
    entete = "Bouchons le ";
  } else if(activeLayer == "vitesses") {
    entete = "Vitesses le ";
  } else if(activeLayer == "vh") {
    entete = "Conditions de conduite hivernale mises &agrave; jour le ";
  }
  
  dateText = entete + checkDate(date.getDate()) + "/" + checkDate(date.getMonth()+1) + "/" + date.getFullYear() + " &agrave; " + checkDate(date.getHours()) + ":" + checkDate(date.getMinutes());
  return dateText;
}


function updateDateCarte() {
	
    // passage en mode dégradé
    if(isDegraded()) { 
    
    	switch(activeLayer){
	 	
	 		case "bouchons" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/dynamique/emprises/segment_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 		break;
	 		case "vitesses" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/dynamique/emprises/segment_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 		break;
	 		case "fermetures" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/fermetures/emprises/jour"+(jourPourFermeture+1)+"/fermeture_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 		break;
	 		case "vh" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/vh/emprises/vh_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 		break;
	 		default : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/dynamique/emprises/segment_TOTALE.png?_=" + new Date().getTime() +" \" />");	
	 }
	 construct(); 
	$('#menu_navigation').css('display', 'none');
      	$('#titre_cumul').css('display', 'none');
	$('#contenu_cumul').css('display', 'none'); 
	$('#degraded').css('display', 'block');  	
     
    } else {
    	if(activeLayer == "bouchons") {
          // lecture date données tps réel
	        etatReseau = getDateCarte(parseInt(synchTpsReel.date_bch,10));
	        
	        // Si dégradé alimentation
          if(synchTpsReel.mode.search("B") != -1) {
	          etatReseau = bouchonsIndispo;
	          switchLayerVisibility("bouchons", false);
	        } else {
	          switchLayerVisibility("bouchons", true);
	        }
	        
	        // Evénements
    	    if(synchTpsReel.mode.search("E") != -1) {
    	        etatReseau = etatReseau + evtsIndispo;
    	        switchLayerVisibility("evenements", false);
    	        
    	    } else {
    	        switchLayerVisibility("evenements", true);
    	    }
    	    
    	    dateControl.div.innerHTML=etatReseau;
	        
	    } else if(activeLayer == "vitesses") {
	        // lecture date données tps réel
	        etatReseau = getDateCarte(parseInt(synchTpsReel.date_vit,10));
	        
	        // Si dégradé alimentation
	        if(synchTpsReel.mode.search("V") != -1) {
	          etatReseau = vitessesIndispo;
	          switchLayerVisibility("vitesses", false);
	        } else {
	          switchLayerVisibility("vitesses", true);
	        }
	
	        // Evénements
    	    if(synchTpsReel.mode.search("E") != -1) {
    	        etatReseau = etatReseau + evtsIndispo;
    	        switchLayerVisibility("evenements", false);
    	        
    	    } else {
    	        switchLayerVisibility("evenements", true);
    	    }
    	    
    	    dateControl.div.innerHTML=etatReseau;
    	    
	    } else if(activeLayer == "vh") {	
	    	etatReseau = getDateCarte(parseInt(synchVH.date_vh,10));
	    	
	    	dateControl.div.innerHTML=etatReseau;
	    }
    }
}
 
// Chargement données de synchronisation (fermetures et tps réel)
function synchronize(layer) {
    reponse = null;
    
    try {
        if (window.XMLHttpRequest) {              
            AJAX=new XMLHttpRequest();              
        } else {                                  
            AJAX=new ActiveXObject("Microsoft.XMLHTTP");
        }
    
        if (AJAX) {
            if(layer == "cartoFermetures") {
              AJAX.open("GET", '/carto/fermetures/cartoFermetures.json?_=' + new Date().getTime(), false);
            } else if(layer == "cartoVh") {
              AJAX.open("GET", '/carto/vh/cartoVH.json?_=' + new Date().getTime(), false);
            } else {
              AJAX.open("GET", '/carto/dynamique/cartoTempsReel.json?_=' + new Date().getTime(), false);
            }
            			
            AJAX.setRequestHeader('Cache-Control', 'no-cache'); 
            AJAX.send(null);
            reponse=eval('('+AJAX.responseText+')');
        }    
    } catch(e) {		
        return;
    }   

    if(reponse != null) {
      if(layer == "cartoFermetures") {
    	  synchFermetures = reponse;
      } else if(layer == "cartoVh") {
         synchVH = reponse;
      } else {
    	  synchTpsReel = reponse;
      } 
      //premier chargement
      if(isDegradedMode  != null){
      	oldIsDegradedMode = isDegradedMode;
      }
      
      if(synchTpsReel != null) {
    	//recuperation de valeur de degrade 
        isDegradedMode = (synchTpsReel.mode.search("D") != -1)? true : false;
      }
      
	  //si on bascule de degrade vers normal recharge la cartographie
      if( oldIsDegradedMode == true && isDegradedMode == false){      
      	$('#map').html("<script type=\"text/javascript\">init();construct();</script><noscript><p><img alt=\"\" src=\"/carto/dynamique/emprises/segment_TOTALE.png?_=" + new Date().getTime() +" \" /></p></noscript>");
      	$('#menu_navigation').css('display', 'block');
      	$('#titre_cumul').css('display', 'block');
	$('#contenu_cumul').css('display', 'block');
	$('#map').width("auto");
      	construct();      	
      }
        
    }                       
} 
      
// refresh des layers actives pour les cartes tps réel
function refresh() {
    onFeatureUnselect(selectedFeature);
    dossier = synchTpsReel.dossier;
    synchronize("cartoTempsReel");
    
    /*
     * Gestion affichage date et modes dégradés
     */
    updateDateCarte();  

    if(dossier != synchTpsReel.dossier) {								
    
        // maj url des layers tps réel
        url = [
            domaine1 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/", 
            domaine2 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/", 
            domaine3 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/", 
            domaine4 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/"
        ];
    
        layers = map.layers;
    
        for(var i=0 ; i<layers.length ; i++)
        {
          // layer de type vectoriel
          if(layers[i].name == "Vector - Tps reel") {
            newUrl = layers[i].protocol.templateUrl.replace("dossier",synchTpsReel.dossier);
            layers[i].protocol.options.url = newUrl;
          
          } 
          // layer de type TMS
          else if(layers[i].name == "TMS - Tps reel") {
            layers[i].setUrl(url);
          } 
        }
        
        reloadVisibleLayers();
    }

    
    /*
     * Gestion période refresh
     */
    if(timerR != synchTpsReel.periode) {
        timerR = synchTpsReel.periode;
        window.clearInterval(idTimerR);
        idTimerR = window.setInterval("refresh()", timerR*1000);
    }
}     

// rechargement layers tps réel si visible
function reloadVisibleLayers() {
    layers = map.getLayersBy("visibility", true);

    for(var i=0 ; i<layers.length ; i++)
    {
      // layer de type vectoriel
      if(layers[i].name == "Vector - Tps reel") {
        layers[i].events.triggerEvent("refresh");  
      } 
      // layer de type TMS
      else if(layers[i].name == "TMS - Tps reel") {
        layers[i].redraw();
      } 
    }
}


/* ---------------- */
/* FONCTION INIT */
/* ---------------- */      
function init(){
	
	//var resizeTimer;
    activeLayer = "bouchons";
    oldLayer = activeLayer + "0";
    synchronize("cartoTempsReel");
  
    // Carte
    map = new OpenLayers.Map( 'map', 
        {
            projection: 'EPSG:27572',
            units: 'm',
            resolutions: [100, 50, 25, 10],
            maxExtent: new OpenLayers.Bounds(534000, 2346000, 691000, 2472000),
            restrictedExtent: new OpenLayers.Bounds(534000, 2346000, 691000, 2472000),
            controls: [
                new OpenLayers.Control.TouchNavigation({
									dragPanOptions: {
										enableKinetic: true
									}
								})      
            ]
        }
    ); 	
    
    // attributionControl
    attributionControl = new OpenLayers.Control.Attribution({id: "attributionControl"});
    map.addControl( attributionControl);
    // dateControl
    dateControl = new OpenLayers.Control({id: "dateReseauControl"});
    map.addControl( dateControl);
    //
    zoomPanel = new OpenLayers.Control.Panel({id: "zoomPanelControl"});
    zoomPanel.addControls([
            new OpenLayers.Control.ZoomIn(),
            new OpenLayers.Control.ZoomToMaxExtent({trigger: function() {
                if (this.map) {
                    this.map.zoomToMaxExtent();
                    map.setCenter(new OpenLayers.LonLat(600000,2429000,0,false,false));
                }    
            }}),
            new OpenLayers.Control.ZoomOut()
        ]);
    map.addControl( zoomPanel);
   

    
    // Couche TMS fond de plan
    fond = new OpenLayers.Layer.TMS( "TMS-Fond de plan",
        urlFond,
        {
    		projection: 'EPSG:27572',
    		layername: 'fond', 
    		type: 'png', 
    		isBaseLayer: true, 
    		visibility: true, 
    		buffer: 0,
    		removeBackBufferDelay: 0,
            transitionEffect: null
        }
    );
    map.addLayer(fond);
  
    // synchronisation des cartes
    urlTpsReel = [
        domaine1 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/", 
        domaine2 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/", 
        domaine3 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/", 
        domaine4 + "/carto/dynamique/" + synchTpsReel.dossier + "/tms/"
    ];
          
    // Couche TMS synoptique bouchons
    bouchons = new OpenLayers.Layer.TMS( "TMS - Tps reel",
        urlTpsReel,
        {
            layername: "bouchons", 
            type: 'png', 
            isBaseLayer: false, 
            visibility: true, 
            buffer: 0,
            attribution: copyrights,
            removeBackBufferDelay: 0,
            transitionEffect: null
        }
    );
    
    map.addLayer(bouchons);
    
    // Couche TMS synoptique vitesses
    vitesses = new OpenLayers.Layer.TMS( "TMS - Tps reel",
        urlTpsReel,
        {
            layername: "vitesses", 
            type: 'png', 
            isBaseLayer: false, 
            visibility: false, 
            buffer: 0,
            attribution: copyrights,
            removeBackBufferDelay: 0,
            transitionEffect: null
        }
    );
    
    map.addLayer(vitesses);
    
    // Couche TMS synoptique vitesses
    fermetures = new OpenLayers.Layer.TMS( "TMS",
        [],
        {
            layername: "fermetures", 
            type: 'png', 
            isBaseLayer: false, 
            visibility: false, 
            buffer: 0,
            attribution: copyrights,
            removeBackBufferDelay: 0,
            transitionEffect: null
        }
    );
    
    map.addLayer(fermetures);
    

    // Couche événements
    evtsG = new OpenLayers.Layer.Vector("Vector - Tps reel", {
                          layername: "evenements",
                          resolutions: [100],
                          styleMap: evtsStyleMap,
                          isBaseLayer: false,
                          visibility: true,
                          strategies: [new OpenLayers.Strategy.Fixed({preload: true})],
                          protocol: new OpenLayers.Protocol.HTTP({
                              templateUrl: "/carto/dynamique/dossier/evenements/" + "general.json",
                              url: "/carto/dynamique/" + synchTpsReel.dossier + "/evenements/" + "general.json",
                              format: new OpenLayers.Format.GeoJSON()
                          }) 
                      });
    map.addLayer(evtsG);
    
    evtsS = new OpenLayers.Layer.Vector("Vector - Tps reel", {
                          layername: "evenements",
                          resolutions: [50],
                          styleMap: evtsStyleMap,
                          isBaseLayer: false,
                          visibility: true,
                          strategies: [new OpenLayers.Strategy.Fixed({preload: true})],
                          protocol: new OpenLayers.Protocol.HTTP({
                              templateUrl: "/carto/dynamique/dossier/evenements/sectoriel.json",
                              url: "/carto/dynamique/" + synchTpsReel.dossier + "/evenements/" + "sectoriel.json",
                              format: new OpenLayers.Format.GeoJSON()
                          }) 
                      });
    map.addLayer(evtsS);
                          
    evtsT = new OpenLayers.Layer.Vector("Vector - Tps reel", {
                          layername: "evenements",
                          resolutions: [25,10],
                          styleMap: evtsStyleMap,
                          isBaseLayer: false,
                          visibility: true,
                          strategies: [new OpenLayers.Strategy.Fixed({preload: true})],
                          protocol: new OpenLayers.Protocol.HTTP({
                              templateUrl: "/carto/dynamique/dossier/evenements/troncon.json",
                              url: "/carto/dynamique/" + synchTpsReel.dossier + "/evenements/" + "troncon.json",
                              format: new OpenLayers.Format.GeoJSON()
                          }) 
                      });
    map.addLayer(evtsT);
    
    // geoloc
    geolocateLayer = new OpenLayers.Layer.Vector('geolocate');
    map.addLayer(geolocateLayer);
    
    // control geoloc
    geolocateCtrl = new OpenLayers.Control.Geolocate({
        bind: false,
        watch: false,
        geolocationOptions: {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        }
    });
    
    // Gestion affichage localisation
    geolocateCtrl.events.register("locationupdated",geolocateCtrl,function(e) {
    	
    	geolocateLayer.removeAllFeatures();
    	
    	var positionStyle = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['default'],  {
    		externalGraphic : "/resources/js/theme/default/img/geoloc-position.png",
    		graphicWidth: 20,
            graphicHeight: 20,
            fillOpacity: 1
    	});
    	
    	if(map.getMaxExtent().contains(e.point.x, e.point.y, false)) {
    		geolocateLayer.addFeatures([
	            new OpenLayers.Feature.Vector(
	            	e.point,
	                {},
	                positionStyle
	            )
		     ]);
		                    	
        	if(locateMe) {
        		if(activeLayer == "vh") {
        			map.panTo(new OpenLayers.LonLat(e.point.x, e.point.y));
        		} else {
        			map.zoomToExtent(geolocateLayer.getDataExtent());
        		}
        		
        		locateMe = false;
        	}
	}

    	
    	
    });
    
    geolocateCtrl.events.register("locationfailed",this,function() {
    	 map.removeControl(panelLocate);
    	 geolocateCtrl.deactivate();
    	 map.removeControl(geolocateCtrl);
    });
    
    map.addControl(geolocateCtrl);
    
    
    var btnLocate = new OpenLayers.Control.Button({ 
        title: "Me localiser",
        displayClass: 'olControlBtnLocateMe',
        trigger: geolocate
     });
    
    var panelLocate = new OpenLayers.Control.Panel({
    	defaultControl: btnLocate,
    	type: OpenLayers.Control.TYPE_BUTTON,
        displayClass: 'olControlPanelLocateMe',
    });
    
    panelLocate.addControls([btnLocate]);
    map.addControl(panelLocate);

       
    // Controle features
    ctrls = new OpenLayers.Control.SelectFeature([evtsG, evtsS, evtsT],
          {onSelect: onFeatureSelect, onUnselect: onFeatureUnselect});
    map.addControl(ctrls);
    ctrls.activate();
    
    // gestion layers
    updateDateCarte();
    idTimerR = window.setInterval("refresh()",timerR*1000);       
	 
    if(!isDegraded()){
    	gotoInitialView();
    }
    
    //surveillance du zoom
    timerCarto = new Date().getTime();
    map.events.register( "zoomend", map, zoomChanged );
    
    // gestion du zoom
	map.zoomToProxy = map.zoomTo;
	map.zoomTo =  function (zoom,xy){
		if(activeLayer != "vh") {
			map.zoomToProxy(zoom,xy); 
		}
	};
   
 
    //construct
    construct();
    //on surveille le changement de taille
	$(window).resize(function() {
		//clearTimeout(resizeTimer);
		resizeTimer = setTimeout("construct()", 100);
	});
	
	geolocateCtrl.activate();
}


function geolocate() {
	locateMe = true;
	geolocateLayer.removeAllFeatures();
	geolocateCtrl.deactivate();
	geolocateCtrl.activate();
}

function zoomChanged ( ) {
	  if((timerCarto+300000) > new Date().getTime()){
	  	refresh();
	  }
}

function loadFavoris(preferences) {

	param = preferences.split(",");
	callSwitchLayer(param[4]);
	map.zoomToExtent(new OpenLayers.Bounds(param[0], param[1], param[2],
			param[3]), true);
	
}


