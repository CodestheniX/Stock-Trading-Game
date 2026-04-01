/* Validierung der Eingaben */
const error_message = [
    "<label id='Error_Message'>_message_</label>",                      // Freie Message
    "<label id='Error_Message' class='text-nowrap'>_message_</label>",  // Freie Message ohne Umbruch
    "<label id='Error_Message'>_placeholder_ erforderlich</label>"      // Pflichtfeld-Message
];

const messageType = 
{
    Frei        : 0,
    OhneUmbruch : 1,
    Pflichtfeld : 2
};

function ValidateInputs(form)
{
    let success = false;

    // Vorhandene Error-Message löschen (nur eine!)
    $('#Error_Message').remove();

    if (form == "Login")
    {
        success = CheckRequired();
    }
    else if (form == "Register")
    {
        success = CheckRequired();
        success = ValidateUserData(success);        
        success = ValidateContactData(success);
    }
    else
    {
        alert("Interner Validierungsfehler - Bitte wenden Sie sich an den Administrator !");
    }
    
    if (success)
    {
        location.href = 'Simulation.html';
    }
}

function CheckRequired() 
{
    let success = true;

    // Pflicht-Eingaben checken
    $('input[required]').each(function (_i, active_input)
    {                
        if (active_input.value == "")
        {
            active_input.focus();            
            $(active_input).css("backgroundColor", "burlywood");            
            $(active_input).after(error_message[messageType.Pflichtfeld].replace("_placeholder_", active_input.placeholder));
            success = false
            return false;
        }
        else
        {
            $(active_input).css("backgroundColor", "#fff");
        }
    });
    return success;
}

function ValidateUserData(success) 
{                    
    if (success)
    {           
        // E-Mail        
        let mailRegex  = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // Quelle: https://www.w3resource.com/javascript/form/email-validation.php (Aufgerufen am: 08.08.2021)
        if (!mailRegex.test($('#EMail').val()))
        {
            $('#EMail').after(error_message[messageType.Frei].replace("_message_", "E-Mail-Adresse ungültig"));
            $('#EMail').focus();
            success = false;
        }

        // Passwort        
        if ((success) && ($('#Passwort_register').val() != $('#Passwort_bestaetigen_register').val()))
        {
            $('#Passwort_register').after(error_message[messageType.Frei].replace("_message_", "Passwörter stimmen nicht überein"));
            $('#Passwort_register').focus();
            success = false;
        }                
    }
    return success;
}

function ValidateContactData(success) 
{
    if (success)
    {                
        //Vorname, Nachname, Geburtsort und Ort dürfen nur alphanumerische Werte enthalten
        let letterRegex = /^[A-Za-z]+$/;
        $('input[justLetters]').each(function (_i, active_input)
        {                
            if ((active_input.value != "") && (!letterRegex.test(active_input.value)))
            {
                active_input.focus();
                $(active_input).after(error_message[messageType.Frei].replace("_message_", "Nur Buchstaben zulässig"));
                success = false
                return false;
            }
        });
        
        // Jahr & Alter
        if (success)
        {
            let currentDate = new Date();
            let birthday    = new Date($('#Geburtsdatum').val());
            
            if ((birthday.getFullYear() < (currentDate.getFullYear() -200)) || (birthday.getFullYear() > currentDate.getFullYear()))
            {
                success = false;
                $('#Geburtsdatum').after(error_message[messageType.Frei].replace("_message_", "Ungültiges Datum"));
                $('#Geburtsdatum').focus();
            }
            if (success)
            {
                let yearDiff    = currentDate.getFullYear() - birthday.getFullYear();
                if (yearDiff < 18)
                {            
                    success = false; // Keine 18 (Jahr)
                }
                else if (yearDiff == 18)
                {
                    if (birthday.getMonth() > currentDate.getMonth())
                    {
                        success = false; // Keine 18 (Monat)
                    }
                    else if (birthday.getMonth() == currentDate.getMonth())
                    {
                        if (birthday.getDate() > currentDate.getDate())
                        {                    
                            success = false; // Keine 18 (Tag)
                        
                        }
                    }
                }
                if (!success)
                {
                    $('#Geburtsdatum').after(error_message[messageType.Frei].replace("_message_", "Registrierung unter 18 Jahren nicht möglich"));
                }
            }
        }

        // Postleitzahl
        if (success)
        {
            if (($('#Postleitzahl').val().length != 5) || ($('#Postleitzahl').val() <= 0))
            {
                success = false;
                $('#Postleitzahl').after(error_message[messageType.Frei].replace("_message_", "Ungültige Postleitzahl"));
                $('#Postleitzahl').focus();
            }
        }
    }
    
    return success;
}

// Registrierung - Funktionen
function ShowPassword()
{   
    if ($('#Passwort_zeigen').prop('checked'))
    {
        $('#Passwort_register').attr('type', 'text');
        $('#Passwort_bestaetigen_register').attr('type', 'text');
    }
    else
    {
        $('#Passwort_register').attr('type', 'password');
        $('#Passwort_bestaetigen_register').attr('type', 'password');        
    }
}