// Anmerkung an Herr Frank: Im Gegensatz zur signup.js werden hier unter anderem deutsche Bezeichnungen für börsenspezifische Variablen verwendet, damit mir die Programmierung leichter fällt

//*************************//
//*** Globale Variablen ***//
//*************************//

// Types für die Funktion "FormatNumber"
const formatType = 
{
    Standard : 0,
    Money    : 1,
    Share    : 2
};

// Allgemein
const cGameMinutes = 10;
const cColorGreen  = "#0d9708";
const cColorRed    = "#a3160c";
const cColorOrange = "#E48526";
const cColorLightOrange = "#e8ab6d";
var countdown = cGameMinutes * 60;
var simulation_running = false;
var transactionOnGoing = false; //Stoppt die Berechnung der Preise während Transaktionen
var minutes;
var seconds;
var intervalID;

// Marktübersicht
const situationType = 
{
    Baerenmarkt : -3,
    Standard    :  0,
    Bullenmarkt :  3
};

var briefkurs             = 100.00;
var geldkurs              = 99.00;
var kursaenderung         = 0.00;
var kursaenderung_Anzahl  = 0; // AB 3 => Bullenmarkt / AB -3 => Bärenmarkt
var kursaenderung_Positiv = true;
var situationCtx;

// Benutzer-Informationen
const cKontostand        = 50000;
var kontostand           = cKontostand;
var ergebnis             = 0;
var marktsituation       = situationType.Standard;
var aktien_depot         = 0;
var aktien_gekauft       = 0;
var aktien_verkauft      = 0;
var aktien_gekauft_Wert  = 0;
var aktien_verkauft_Wert = 0;

// Chart + Kauf-/Verkauf
const cGebuehren_Fix = 4.95;
const cGebuehren_Max = 59.99;
const cGebuehren_Min = 9.99;
const cMovePerSecond = 1000 / 600; // Verschiebung auf der X-Achse des Stockcharts pro Sekunde => Chart-Width / (10 Min. * 60 Sek.)
const cMovePerCent   = 0.5; // Verschiebung auf der Y-Achse des Stockcharts pro Cent 

var gebuehren      = cGebuehren_Min;
var ekPreis_Einzel = briefkurs + gebuehren;
var ekPreis_Gesamt = ekPreis_Einzel;
var vkPreis_Einzel = geldkurs - gebuehren;
var vkPreis_Gesamt = vkPreis_Einzel;
var StockchartPosX = 0;
var StockchartPosY = 200;
var stockCtx;

//******************//
//*** Funktionen ***//
//******************//
//*** Initialisierungen ***//
$(document).ready(function()
{
    Init_Simulation();
});

function StartEndSimulation()
{
    if (!simulation_running)
    {
        Init_Simulation();
        intervalID = setInterval(Timer, 1000);
        $("#StartEndSimulation").html("Simulation beenden");
    }
    else
    {        
        clearInterval(intervalID);
        SellAllShares();
        $("#StartEndSimulation").html("Simulation starten");        
    }
    
    $("input").prop('disabled', simulation_running);
    $("#Aktien_Kaufen").prop('disabled', simulation_running);
    $("#Aktien_Verkaufen").prop('disabled', simulation_running);
    simulation_running = !simulation_running;
}

function Init_Simulation()
{
    //*** Variablen initialisieren ***//
    // Allgemein
    countdown = cGameMinutes * 60;
    $('#container-coundown').css('color', cColorOrange);
    simulation_running = false;
    transactionOnGoing = false;        

    // Marktübersicht
    briefkurs                = 100.00;
    geldkurs                 = 99.00;
    kursaenderung            = 0.00;
    kursaenderung_Anzahl     = 0;
    kursaenderung_Richtung   = true;
    marktsituation           = situationType.Standard;    

    // Benutzer-Informationen
    kontostand           = cKontostand;
    ergebnis             = 0;
    aktien_depot         = 0;
    aktien_gekauft       = 0;
    aktien_verkauft      = 0;
    aktien_gekauft_Wert  = 0;
    aktien_verkauft_Wert = 0;
    $('#ergebnis').css('color', cColorOrange);

    // Chart + Kauf-/Verkauf
    gebuehren      = cGebuehren_Min;
    ekPreis_Einzel = briefkurs + gebuehren;
    ekPreis_Gesamt = ekPreis_Einzel;
    vkPreis_Einzel = geldkurs - gebuehren;
    vkPreis_Gesamt = vkPreis_Einzel;
    StockchartPosX = 0;
    StockchartPosY = 200;

    // Orderbuch
    $("#Orderbuch_Eintraege").html("");    
    $("#orderbuch").css("display", "none");

    //*** Werte setzen ***//
    // Chart + Kauf-/Verkauf
    $("#container-coundown").html(cGameMinutes + ":00 Minuten");
    FormatNumber(ekPreis_Einzel, '#EK_Preis_Einzel', formatType.Money, "x ");
    FormatNumber(ekPreis_Gesamt, '#EK_Preis_Gesamt', formatType.Money, "= " );
    FormatNumber(vkPreis_Einzel, '#VK_Preis_Einzel', formatType.Money, "x ");
    FormatNumber(vkPreis_Gesamt, '#VK_Preis_Gesamt', formatType.Money, "= ");
    
    // Marktübersicht
    FormatNumber(briefkurs    , '#briefkurs'    , formatType.Money);
    FormatNumber(geldkurs     , '#geldkurs'     , formatType.Money);
    FormatNumber(kursaenderung, '#kursaenderung', formatType.Money);
    
    // Benutzer-Informationen
    FormatNumber(kontostand     , '#kontostand'     , formatType.Money);
    FormatNumber(ergebnis       , '#ergebnis'       , formatType.Money);
    FormatNumber(aktien_depot   , '#aktien_depot'   , formatType.Share);
    FormatNumber(aktien_gekauft , '#aktien_gekauft' , formatType.Share);
    FormatNumber(aktien_verkauft, '#aktien_verkauft', formatType.Share);
    
    $("#Anzahl_Kauf").val(1);
    $("#Anzahl_Verkauf").val(1);

    //*** Chart initialisieren & Inputs handeln ***//    
    Init_StockChart();
    Init_SituationChart();
    $("input").prop('disabled', true);
    $("#Aktien_Kaufen").prop('disabled', true);
    $("#Aktien_Verkaufen").prop('disabled', true);    
}

function Init_StockChart()
{    
    // Anmerkung: Da der Text sich standardmäßig nur verschwommen darstellen lässt, muss die Auflösung des Kontexts, die Linienbreite, Schriftgröße etc. angepasst werden...    
    let canvas_height;
    let canvas_width;
    let canvas_drawer = 0;
    let euro_value    = 101.5;
    let minute_value  = 2;
    let fontsize      = "15px";
    
    stockCtx = $("#chart-kurs")[0].getContext("2d");
    stockCtx.canvas.width  = 1000; // Horizontale Auflösung
    stockCtx.canvas.height =  400; // Vertikale Auflösung 
    canvas_height = stockCtx.canvas.height;
    canvas_width  = stockCtx.canvas.width;
    stockCtx.clearRect(0, 0, stockCtx.canvas.width, stockCtx.canvas.height);
    
    // Für die unterschiedlichen Display-Größen...
    if (window.innerWidth < 770)
    {
        fontsize = "30px";
    }
    else if (window.innerWidth < 370)
    {
        fontsize = "100px";
    }
    else if (window.innerWidth < 300)
    {
        fontsize = "170px";
    }    

    stockCtx.canvas.width  = 1000; // Horizontale Auflösung
    stockCtx.canvas.height =  400; // Vertikale Auflösung 
    stockCtx.textBaseline  = "bottom";
    stockCtx.font          = fontsize + " Sans-serif";
    stockCtx.fillStyle     = cColorOrange;
    stockCtx.lineWidth     = 1;
    stockCtx.strokeStyle   = cColorLightOrange;        

    // Horizontale Linien
    while (canvas_drawer < canvas_height)
    {
        stockCtx.moveTo(0, canvas_drawer);
        stockCtx.lineTo(stockCtx.canvas.width, canvas_drawer);        
        canvas_drawer = canvas_drawer + (canvas_height / 4);
        stockCtx.stroke();
        stockCtx.fillText(FormatNumber(euro_value, "", formatType.Money), 5, canvas_drawer - 5);
        euro_value = euro_value - 2;
    }
    
    // Vertikale Linien
    canvas_drawer = 0;
    while (canvas_drawer < canvas_width)
    {        
        stockCtx.moveTo(canvas_drawer, 0);
        stockCtx.lineTo(canvas_drawer, stockCtx.canvas.height);
        canvas_drawer = canvas_drawer + (canvas_width / 5);
        stockCtx.stroke();
        stockCtx.fillText(minute_value + " Minuten", canvas_drawer + 5, canvas_height - 5);
        minute_value = minute_value + 2;
    }

    // Linienbreite für den Aktienkurs setzen
    stockCtx.lineWidth = 3;
}

function Init_SituationChart()
{
    situationCtx             = $("#chart-marktsituation")[0].getContext("2d");
    situationCtx.textAlign   = "center";
    situationCtx.textBaseline= 'middle';
    situationCtx.font        = "120px Sans-serif";
    situationCtx.lineWidth   = 3;
    situationCtx.clearRect(0, 0, situationCtx.canvas.width, situationCtx.canvas.height);
}

//*** Berechnungen & Formatierungen ***//
function FormatNumber(number, id ,type, sign)
{
    if (sign === undefined)
    {
        sign = "";
    }

    if (type == formatType.Standard)
    {
        number = sign + number.toLocaleString('de-DE');
    }
    else if (type == formatType.Money)
    {        
        number = sign + number.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " €";
    }
    else if (type == formatType.Share)
    {
        number = sign + number.toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0}) + " Aktien";
    }
    
    if (id === "")
    {
        return number;
    }
    else
    {
        $(id).html(number);
    }    
}

function CalculateTotalPrice(purchasingPrice) // Einkaufspreis (purchasing price) = True ; Verkaufspreis (selling price) = False
{
    let shares;
    if (purchasingPrice)
    {
        shares = $('#Anzahl_Kauf').val();
        if (shares >= 1)
        {
            ekPreis_Gesamt = shares * ekPreis_Einzel;
            FormatNumber(ekPreis_Gesamt, '#EK_Preis_Gesamt', formatType.Money, "= " );
        }
    }
    else
    {
        shares = $('#Anzahl_Verkauf').val();
        if (shares >= 1)
        {
            vkPreis_Gesamt = shares * vkPreis_Einzel;
            FormatNumber(vkPreis_Gesamt, '#VK_Preis_Gesamt', formatType.Money, "= " );
        }
    }
}

function CalculateCourses()
{    
    //*** Kurs berechnen ***//
    kursaenderung = (Math.floor(Math.random() * 5) + 1) / 100; // 0,01 € - 0,05 €
    if (marktsituation == situationType.Standard)
    {
        // 50% Wahrscheinlichkeit auf eine positive oder negative Änderung
        kursaenderung_Positiv = Boolean(Math.random() > 0.50);
    }
    else if (marktsituation == situationType.Bullenmarkt)
    {
        // 75% Wahrscheinlichkeit auf eine positive Änderung
        kursaenderung_Positiv = Boolean(Math.random() < 0.75);
    }
    else if (marktsituation == situationType.Baerenmarkt)
    {
        // 75% Wahrscheinlichkeit auf eine negative Änderung
        kursaenderung_Positiv = Boolean(Math.random() > 0.75);
    } 

    if (!kursaenderung_Positiv)
    {
        kursaenderung = kursaenderung * -1;
    }
    briefkurs = briefkurs + kursaenderung;
    geldkurs  = geldkurs  + kursaenderung;

    //*** Ausgabe ***//
    FormatNumber(briefkurs     , '#briefkurs'      , formatType.Money);
    FormatNumber(geldkurs      , '#geldkurs'       , formatType.Money);
    FormatNumber(kursaenderung , '#kursaenderung'  , formatType.Money);
    ShowMarketSituation();
}

function ShowMarketSituation()
{                
    let posX     = 150;
    let posY     =  90;
    let maxWidth = situationCtx.canvas.width - 70;

    // Zählen der Kursänderungen für den Bullen-/ & Bärenmarkt
    if ((kursaenderung > 0) && (kursaenderung_Anzahl >= situationType.Standard))
    {
        kursaenderung_Anzahl++;
    }
    else if ((kursaenderung < 0) && (kursaenderung_Anzahl <= situationType.Standard))
    {
        kursaenderung_Anzahl--;
    }
    else
    {
        kursaenderung_Anzahl = 0;
        if (kursaenderung > 0)
        {
            kursaenderung_Anzahl++;
        }
        else
        {
            kursaenderung_Anzahl--;
        }
    }    

    // Aktualisierung des Marktsituation-Charts
    situationCtx.clearRect(0, 0, situationCtx.canvas.width, situationCtx.canvas.height);
    if (kursaenderung_Anzahl >= situationType.Bullenmarkt)
    {                
        situationCtx.fillStyle = "#066603"; // Grün
        situationCtx.fillText("Bullenmarkt"  , posX, posY, maxWidth);
        situationCtx.strokeText("Bullenmarkt", posX, posY, maxWidth);
        marktsituation = situationType.Bullenmarkt;
    }
    else if (kursaenderung_Anzahl <= situationType.Baerenmarkt)
    {                
        situationCtx.fillStyle = "#820e05"; // Rot     
        situationCtx.fillText("Bärenmarkt"  , posX, posY, maxWidth);
        situationCtx.strokeText("Bärenmarkt", posX, posY, maxWidth);
        marktsituation = situationType.Baerenmarkt;        
    }        
    else
    {        
        marktsituation = situationType.Standard;
    }
}

function UpdateStockchart()
{    
    stockCtx.beginPath();
    if (kursaenderung > 0)
    {
        stockCtx.strokeStyle = cColorGreen;
    }
    else
    {
        stockCtx.strokeStyle = cColorRed;
    }    
    stockCtx.moveTo(StockchartPosX, StockchartPosY);    
    StockchartPosX = StockchartPosX + cMovePerSecond;
    StockchartPosY = StockchartPosY - (cMovePerCent * kursaenderung * 100);
    stockCtx.lineTo(StockchartPosX, StockchartPosY);
    stockCtx.stroke();
}

function CalculatePrices(type) //Type leer => nur beim Fokus berechnen
{
    //*** Nur berechnen, wenn das jeweilige Element im Fokus / gewählt ist und keine Transaktoin im Gange ist ***/
    if ((!transactionOnGoing) || (type != undefined))
    {        
        if (($("#Anzahl_Kauf").is(":focus")) || (type == "EK"))
        {
            let shares = Number($('#Anzahl_Kauf').val());            
            if (shares >= 1)
            {
                gebuehren = GetFees(shares, briefkurs);           
                ekPreis_Einzel = briefkurs + (gebuehren / shares);
                FormatNumber(ekPreis_Einzel, '#EK_Preis_Einzel', formatType.Money, "x ");;
                CalculateTotalPrice(true);                
            }
        }
        else if (($("#Anzahl_Verkauf").is(":focus")) || (type == "VK")) 
        {
            let shares = Number($('#Anzahl_Verkauf').val());            
            if (shares >= 1)
            {
                gebuehren = GetFees(shares, geldkurs);
                vkPreis_Einzel = geldkurs - (gebuehren / shares);
                FormatNumber(vkPreis_Einzel, '#VK_Preis_Einzel', formatType.Money, "x ");
                CalculateTotalPrice(false);
            }
        }
    }
}

function GetFees(shares, price)
{
    let fees = (shares * price) * 0.0025 + cGebuehren_Fix;
    if (fees < cGebuehren_Min)
    {
        fees = cGebuehren_Min;
    }
    else if (fees > cGebuehren_Max)
    {
        fees = cGebuehren_Max;
    }
    return fees;
}

//*** Kauf-/ & Verkauf-Funktionen ***//
function BuyShares()
{    
    let aktien_anzahl = Number($("#Anzahl_Kauf").val());
    $('#Error_Message').remove();
    transactionOnGoing = true;
    try
    {    
        CalculatePrices("EK");
        if (aktien_anzahl >= 1)
        {
            if (ekPreis_Gesamt <= kontostand)
            {
                kontostand          = kontostand - ekPreis_Gesamt;                
                aktien_depot        = aktien_depot + aktien_anzahl;
                aktien_gekauft      = aktien_gekauft + aktien_anzahl;
                aktien_gekauft_Wert = aktien_gekauft_Wert + ekPreis_Gesamt;
                
                FormatNumber(kontostand    , '#kontostand'     , formatType.Money);
                FormatNumber(aktien_depot  , '#aktien_depot'   , formatType.Share);
                FormatNumber(aktien_gekauft, '#aktien_gekauft' , formatType.Share);                
                AddOrderbookEntry("Kauf", aktien_anzahl, briefkurs, gebuehren, ekPreis_Gesamt);
                CalculateResult();
                $("#Anzahl_Kauf").val("1");
            }
            else
            {
                $("#Anzahl_Kauf").after(error_message[messageType.OhneUmbruch].replace("_message_", "Kontostand nicht ausreichend"));
            }
        }
        else
        {
            $("#Anzahl_Kauf").after(error_message[messageType.OhneUmbruch].replace("_message_", "Ungültige Eingabe"));
        }
    }
    finally
    {
        transactionOnGoing = false;
    }
}

function SellShares()
{
    let aktien_anzahl = Number($("#Anzahl_Verkauf").val());
    $('#Error_Message').remove();
    transactionOnGoing = true;
    try
    {    
        CalculatePrices("VK");
        if (aktien_anzahl >= 1)
        {
            if (aktien_anzahl <= aktien_depot)
            {
                kontostand           = kontostand + vkPreis_Gesamt;
                aktien_depot         = aktien_depot - aktien_anzahl;
                aktien_verkauft      = aktien_verkauft + aktien_anzahl;
                aktien_verkauft_Wert = aktien_verkauft_Wert + vkPreis_Gesamt;                
                
                FormatNumber(kontostand     , '#kontostand'     , formatType.Money);
                FormatNumber(aktien_depot   , '#aktien_depot'   , formatType.Share);
                FormatNumber(aktien_verkauft, '#aktien_verkauft', formatType.Share);
                AddOrderbookEntry("Verkauf", aktien_anzahl, geldkurs, gebuehren, vkPreis_Gesamt);
                CalculateResult();
                $("#Anzahl_Verkauf").val("1");
            }
            else
            {
                $("#Anzahl_Verkauf").after(error_message[messageType.OhneUmbruch].replace("_message_", "Depotbestand nicht ausreichend"));
            }
        }
        else
        {
            $("#Anzahl_Verkauf").after(error_message[messageType.OhneUmbruch].replace("_message_", "Ungültige Eingabe"));
        }
    }
    finally
    {
        transactionOnGoing = false;
    }
}

function SellAllShares()
{
    //*** Wird nur beim Beenden der Simulation ausgeführt ***/    
    if (aktien_depot > 0)
    {
        $("#Anzahl_Verkauf").val(aktien_depot);
        SellShares();
    }
}

function CalculateResult()
{
    let depotbestand_Wert = (aktien_depot * geldkurs);
    if (aktien_depot != 0)
    {
        depotbestand_Wert = depotbestand_Wert - GetFees(aktien_depot, geldkurs);
    }     
    ergebnis = aktien_verkauft_Wert + depotbestand_Wert - aktien_gekauft_Wert;

    if (ergebnis > 0)
    {
        $('#ergebnis').css('color', cColorGreen);
    }
    else if (ergebnis < 0)
    {
        $('#ergebnis').css('color', cColorRed);
    }
    else
    {
        $('#ergebnis').css('color', cColorOrange);
    }

    FormatNumber(ergebnis, '#ergebnis', formatType.Money);
}

function AddOrderbookEntry(type, shares, course, fees, turnover)
{
    let sign_Share;
    let sign_Money;
    let ownClass;
    if (type == "Verkauf")
    {
        sign_Share = "- ";
        sign_Money = "+ ";
        ownClass   = "class='tr-sell'";
    }
    else
    {
        sign_Share = "+ ";
        sign_Money = "- ";
        ownClass ="class='tr-buy'";
    }

    let newRow =
        `<tr ${ownClass}>
            <th class="td-text">${type}</th>
            <td class="td-numeric">${FormatNumber(shares, "", formatType.Standard, sign_Share)}</td>
            <td class="td-numeric">${FormatNumber(course, "", formatType.Money)}</td>
            <td class="td-numeric">${FormatNumber(fees, "", formatType.Money)}</td>
            <td class="td-numeric">${FormatNumber(turnover, "", formatType.Money, sign_Money)}</td>
            <td class="td-text">${GetTime(false)}</td>            
        </tr>`
    ;    
    $("#Orderbuch_Eintraege").html(newRow + $("#Orderbuch_Eintraege").html());
    
    if ($('#orderbuch').css('display') == "none")
    {
        $("#orderbuch").css("display", "block");
    }
}

function GetTime(remainingTime) // True = Verbleibende Zeit ; False = Vergangene Zeit
{
    let time = countdown;
    if (!remainingTime)
    {        
        time = (cGameMinutes * 60) - countdown;
    }
    
    minutes = Math.floor(time / 60);
    seconds = time % 60;
    
    if (minutes <10)
    {
        minutes = "0" + minutes;
    }
    if (seconds <10)
    {
        seconds = "0" + seconds;
    }        

    return minutes + ":" + seconds + " Minuten"
}

//*** Timer-gesteuerte Funktionen ***//
function Timer()
{    
    if (countdown <= 0)
    {
        StartEndSimulation();        
    }
    else
    {
        Countdown();
        UpdateMarketInformation();
        CalculatePrices();
        if (countdown == 9)
        {
            $('#container-coundown').css('color', cColorRed);
            $('#container-coundown').css('border-color', cColorOrange);
        }
    }
}

function Countdown()
{    
    countdown--;
    $("#container-coundown").html(GetTime(true));    
}

function UpdateMarketInformation()
{
    if (!transactionOnGoing)
    {
        CalculateCourses();
        UpdateStockchart();
        CalculateResult();
    }
}