var timerFlash;
var timerCumul;
var timerImgCourbe;


$(document).ready(function() {
	//récupération d'un paramétre dans l'url
	$.urlParam = function(name){
				var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
				if(results != null)
				{
					return results[1];
				}else{
					return null;
				}
	}
	//evenement unload jquery pour recuperer l'emprise
	$( window ).unload(function() {		
		$.cookie("emprise",map.getExtent().toString() + "," + activeLayer, { expires: 7 });				
	});
	
	//on positionne le clik sur la div accueil
	$("#accueil").click(function() {		
	  $("#accueil").hide();
	});
	//vérification d'affichage de la div accueil
	if($.urlParam('accueil') != 'false'){
		$("#accueil").css("display","block");
	}	
	//vérification d'affichage de la div accueil
	if($.urlParam('view') == 'plus'){
		
		$("#cartographie").hide();
		$("#plus").show();
		$("#image_menu_cartographie").attr("src","/resources/images/cartographie.png");
		$("#lien_cartographie").attr("href","javascript:showHide('cartographie',false);");
		
		timerFlash = refreshed("/refreshed/alert_reseau.jsp.html", "flash", 180000);		
		fetches("/refreshed/alert_reseau.jsp.html","flash");
		
		timerCumul = refreshed("/refreshed/cumul_bouchon.jsp.html", "cumul", 180000);		
		fetches("/refreshed/cumul_bouchon.jsp.html","cumul");
		
		timerImgCourbe = refreshedImg("/courbes/indiceCumulBouchon/cumulBouchon_1.png", "courbe", 180000);
		$("#courbe").attr("src", "/courbes/indiceCumulBouchon/cumulBouchon_1.png");
		
	}else if ($.urlParam('view') == 'navigation'){
		
		$("#cartographie").hide();
		$("#navigation").show();
		$("#image_menu_cartographie").attr("src","/resources/images/cartographie.png");
		$("#lien_cartographie").attr("href","javascript:showHide('cartographie',false);");
		
	}
	if(isDegraded()){		
		$('#degraded').css('display', 'block');
		$('.masked').css('display', 'none');
		$('.masked').css('display', 'none');
		$('#menu_navigation').css('display', 'none');
		$('#titre_cumul').css('display', 'none');
		$('#contenu_cumul').css('display', 'none');
	}
});

function showHide(id){	
	
	//mise à jour en ajax des contenu dynamiques
	
	if(id=="plus" && $("#"+id).is(":hidden")){
		timerFlash = refreshed("/refreshed/alert_reseau.jsp.html", "flash", 180000);		
		fetches("/refreshed/alert_reseau.jsp.html","flash");
		
		timerCumul = refreshed("/refreshed/cumul_bouchon.jsp.html", "cumul", 180000);		
		fetches("/refreshed/cumul_bouchon.jsp.html","cumul");
		
		timerImgCourbe = refreshedImg("/courbes/indiceCumulBouchon/cumulBouchon_1.png", "courbe", 180000);
		$("#courbe").attr("src", "/courbes/indiceCumulBouchon/cumulBouchon_1.png");
	
		callXiti();
		
				
	}else{
		clearInterval(timerFlash);
		clearInterval(timerCumul);
		clearInterval(timerImgCourbe);
		
	}
	
		
	//affichage
	if($("#"+id).is(":hidden")){
		$("#navigation").hide();
		$("#couche").hide();
		$("#legende").hide();
		$("#plus").hide();
		if(id != "couche"  && id != "legende"){
			$("#cartographie").hide();
		}
		$("#"+id).show();
	}else{		
		$("#navigation").hide();
		$("#couche").hide();
		$("#legende").hide();	
		$("#plus").hide();		
		$("#cartographie").show();	
	}
	if(!$("#cartographie").is(":hidden")){
		$("#image_menu_cartographie").attr("src","/resources/images/couche.png");
		$("#lien_cartographie").attr("href","javascript:showHide('couche',false);");
		if(typeof map == 'undefined'){
			init();
		}	
	
			
	}else{
		$("#image_menu_cartographie").attr("src","/resources/images/cartographie.png");
		$("#lien_cartographie").attr("href","javascript:showHide('cartographie',false);");
	}
	

}
function refreshed(content, destination, duree){		
		b = setInterval("fetches('"+content+"','"+destination+"');",duree);
		return b;			
	}
	
function refreshedImg(src, destination, duree){		
		b = setInterval("imgAttr('"+src+"','"+destination+"')",duree);		
		return b;			
	}
	
function imgAttr(source,destination){
	$("#"+destination).attr("src", source+"?_="+ new Date().getTime());
}
	

function fetches(url, id){
	
	//appel ajax pour mise a jour
		$.ajax({
			   type: "GET",
			   url: ""+url+"",
			   cache: false,
			   dataType: "html",
			   error:function(msg){},
			   beforeSend:function(img){$('#'+id).prepend("<div style=\"text-align:center;\"><img src=\"/resources/images/ajax-loader.gif\" style=\"margin:2px;\"  /></div>");},
			   success:function(data){				
				$('#'+id).html(data);			
			}});
	
}

function viewFlash(id){

	if( $("#"+id).is(":visible") ){
		$(".flash").hide();	
	}else{
		$(".flash").hide();
		$("#"+id).show();
	}	
	
	
}

function callSwitchLayer(layer, j){
	
	 
	
	 if(isDegraded()) {
	 	switch(layer){
	 	
	 		case "bouchons" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/dynamique/emprises/segment_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 			break;
	 		case "vitesses" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/dynamique/emprises/arc_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 			break;
	 		case "fermetures" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/fermetures/emprises/jour"+(j+1)+"/fermeture_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 			break;
	 		case "vh" : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/vh/emprises/vh_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 			break;
	 		default : 
	 			$('#map').html("<img alt=\"\" src=\"/carto/dynamique/emprises/segment_TOTALE.png?_=" + new Date().getTime() +" \" />");
	 			break;
	 	}
      		
     } else {
    	 switchMap(layer, j);		
     }
	 
	//menu aide avec legende pour carte vh
 	if(layer=="vh"){
		$("#menu_legende").show();
		$("#dateReseauControl").css("background-color", "#FF6347");
	} else {
		$("#menu_legende").hide();
		$("#dateReseauControl").css("background-color", "#EEEEEE");
	}
 	
	$("#couche").css("display","none"); 
	 
 	  
         
} 

function construct()
	{	
		
		//récupération des variables
			
			var minSize = 200;
			var maxSize = 1024;
			var height = $(window).height();
			var degradedWidth = 552;
			var degradedHeight = 404;			
			
		//on vérifie que l'on a la div map et que l'on est pas en dégradé
		if($('#map') && !isDegraded()){			
			
			// pour browser Android natif
			if (typeof(height)==='undefined') {
				height = screen.height;
			}			
			//menu sytadin
			height -= 40;
			//masquage de la barre d'adresse
			if(/iPhone|iPod/i.test(navigator.userAgent)) {
				height += 60;
				//on force le masquage
				setTimeout(function() { 
					window.scrollTo(0, 1);
					$('#accueil').height(height+37);
					 }, 100);
				
			}
			
						
			
			//les min / max : height
			if (height < minSize ) {
				height = minSize ;
			} else if (height > maxSize ) {
				height = maxSize ;
			}
			//on fixe la taille de la div map
			$('#map').css('height', height+'px');			
			//on update la carto
			updateMap();	
			
			$('#degraded').css('display', 'none');
			$('.masked').css('display', 'block');			

		}else{
			$('#map').css('width',degradedWidth+'px');
			$('#degraded').css('width',(degradedWidth-6)+'px');			
			$('#map').css('height',degradedHeight+'px');
			$('#degraded').css('display', 'block');
			$('.masked').css('display', 'none');
		}		
		
	}	
	
function isDegraded(){

	if($.urlParam('degraded') == 'true'){
		return true;
	}
	if(typeof(synchTpsReel) != 'undefined'){
		if( synchTpsReel == null){
			synchronize("cartoTempsReel");
		}
	}
	if(typeof(isDegradedMode) != 'undefined'){
		return isDegradedMode;
	}else{
		return false;
	}
	

}
function showTpsParcours(divId){
	
		
		if(divId=='TOUS'){
			$(".BP").css("display","block");
			$(".SUDOUEST").css("display","block");
			$(".NORDOUEST").css("display","block");
			$(".NORDEST").css("display","block");
			$(".SUDEST").css("display","block");
			$(".GRANDESLIAISONS").css("display","block");
					
		}else{
			$(".BP").css("display","none");
			$(".SUDOUEST").css("display","none");
			$(".NORDOUEST").css("display","none");
			$(".NORDEST").css("display","none");
			$(".SUDEST").css("display","none");
			$(".GRANDESLIAISONS").css("display","none");
		}
		$('.'+divId).css("display", "block");
		blockToAffich = divId;
		pageToAffich = "tps";
		
	
}	

function showHideTwitter(){
		if($("#twitter").is(":hidden")){
			$("#twitter").show();
		}else{
			$("#twitter").hide();
		}


}