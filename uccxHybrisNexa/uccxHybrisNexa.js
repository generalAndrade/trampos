var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.container = finesse.container || {};
clientLogs = finesse.cslogger.ClientLogger || {};  // for logging

/** @namespace */
finesse.modules = finesse.modules || {};
finesse.modules.uccxHybrisNexa = (function ($) {
    var user, dialogs, clientlogs,
        
    makeRequest = function (url, options, handlers) {
        var params, uuid;
        clientLogs.log("makeRequest()");
        
        // Protect against null dereferencing of options & handlers allowing its (nonexistant) keys to be read as undefined
        params = {};
        options = options || {};
        handlers.success = _util.validateHandler(handlers.success);
        handlers.error = _util.validateHandler(handlers.error);

        // Request Headers
        params[gadgets.io.RequestParameters.HEADERS] = {};

        // HTTP method is a passthrough to gadgets.io.makeRequest
        params[gadgets.io.RequestParameters.METHOD] = options.method;

        if (options.method === "GET") {
            // Disable caching for GETs
            if (url.indexOf("?") > -1) {
                url += "&";
            } else {
                url += "?";
            }
            url += "nocache=" + _util.currentTimeMillis();
        } else {
            // Generate a requestID and add it to the headers
            uuid = _util.generateUUID();
            params[gadgets.io.RequestParameters.HEADERS].requestId = uuid;
            params[gadgets.io.RequestParameters.GET_FULL_HEADERS] = "true";
        }
        
        // Add authorization to the request header if provided
        if(options.authorization) {
            params[gadgets.io.RequestParameters.HEADERS].Authorization = options.authorization;
        }

        // Add content type & body if content body is provided
        if (options.content) {
            // Content Type
            params[gadgets.io.RequestParameters.HEADERS]["Content-Type"] = options.contentType;
            // Content
            params[gadgets.io.RequestParameters.POST_DATA] = options.content;
        }

        // Call the gadgets.io.makereqest function with the encoded url
        clientLogs.log("makeRequest(): Making a REST API request to: " + url);
        gadgets.io.makeRequest(encodeURI(url), handleResponse(handlers), params);
    },
    
    handleResponse = function(handlers) {
        return function (response) {
            clientLogs.log("handleResponse(): The response status code is: ");
            
            // Send the response to the success handler if the http status
            // code is 200 - 299. Send the response to the error handler
            // otherwise.
            if (response.rc >= 200 && response.rc < 300 && handlers.success) {
                clientLogs.log("handleResponse(): Got a successful response.");
                handlers.success(response);
            } else if (handlers.error) {
                clientLogs.log("handleResponse(): Got a failure response.");
                handlers.error(response);
            } else {
                clientLogs.log("handleResponse(): Missing the success and/or error handler.");
            }
        };
    },
    
    /**
     * Handler for when the REST API response has a HTTP status code >= 200 and < 300.
     */
    handleResponseSuccess = function(response) {
        clientLogs.log("handleResponseSuccess():");
        // Parse the response text to JSON format
        var responseTextJSON = JSON.parse(response.text);
        
        // Update the gadget with the response text (unformatted)
        //$("#responseBody").text(response.text);
	$("#responseBody").text(response.text);

        gadgets.window.adjustHeight();
    },
    
    /**
     * Handler for when the REST API response has a HTTP status code < 200 and >= 300. 
     */
    handleResponseError = function(response) {
        clientLogs.log("handleResponseError():");
        $("#responseBody").text("Something went wrong with the REST call.");
        gadgets.window.adjustHeight();
    },
    
    //Get DNIS value from dialog object properties
    callerDialog = function(dialog){
        var callVars = dialog.getMediaProperties();
        //$('#dnis').text(dialog.getMediaProperties().DNIS);
        $("#fromAddress").text(dialog.getFromAddress());
    }

    /**
     * Handle when the dialog object is updated/changed
     */
    _processCall = function (dialog) {
        callerDialog(dialog);
        clientLogs.log("_processCall()");
    },

    /**
     *  Handler for additions to the Dialogs collection object. This will occur when a new
     *  Dialog is created on the Finesse server for this user.
     */
    handleNewDialog = function(dialog) {
        clientLogs.log("handleNewDialog()");
        var year = new Date().getFullYear();
        var month = new Date().getMonth();

        id = Math.floor((Math.random() * year) + month);

	var fromAddress_ = dialog.getFromAddress();
        var extension_   = user.getExtension();

        // Call the REST API and display the results
        //var url = "http://10.10.20.10:8082/finesse/api/SystemInfo";
          var ipList = [['6002','10.10.20.12'],['6001','10.10.20.13']];
          var ramalIp;
          ipList.forEach(function(element){
              if(element[0] === extension_)
                ramalIp = element[1];
          })
          
          var url = "http://"+ ramalIp+":3000/api";
          //var contentBody = '{"id" : "'+ id +'","title" : "teste_leo"}';
	var contentBody = '{"dnis" : "'+ extension_ +'","ani" :"' + fromAddress_ + '"}';
        makeRequest(url, {
            method: 'POST',
            //authorization: _util.getAuthHeaderString(finesse.gadget.Config),
            contentType: 'application/json',
            content: contentBody,
        }, {
            success: handleResponseSuccess,
            error: handleResponseError,
        });
        //Display dialog information during the arriving calling        
        callerDialog(dialog);
        
        // add a handler to be called when the dialog object changes
        dialog.addHandler('change', _processCall);
    },
     
    /**
     *  Handler for deletions from the Dialogs collection object for this user. This will occur
     *  when a Dialog is removed from this user's collection (example, end call)
     */
    handleEndDialog = function(dialog) {
        clientLogs.log("handleEndDialog()");
        
        // Update the gadget accordingly
        $("#responseBody").text("Wainting for a call...");
        gadgets.window.adjustHeight();
    },

    //Get the extension value from user object properties
    render = function(){
        currentState = user.getState();
        $('#extension').text(user.getExtension());
    }

    /**
     * Handler for the onLoad of a User object. This occurs when the User object is initially read
     * from the Finesse server. Any once only initialization should be done within this function.
     */
    handleUserLoad = function (userevent) {
        clientLogs.log("handleUserLoad()");
        // Get an instance of the dialogs collection and register handlers for dialog additions and
        // removals
        dialogs = user.getDialogs( {
            onCollectionAdd : handleNewDialog,
            onCollectionDelete : handleEndDialog
        });
        
        render();

        // Set the text on the gadget to be something default
        $("#responseBody").text("Wainting for a call...");
        gadgets.window.adjustHeight();
    },
      
    /**
     *  Handler for all User updates
     */
    handleUserChange = function(userevent) {
        clientLogs.log("handleUserChange()");
    };

    /** @scope finesse.modules.uccxHybrisNexa */
    return {
        /**
         * Performs all initialization for this gadget
         */
        init : function () {
            var cfg = finesse.gadget.Config;
            _util = finesse.utilities.Utilities;

            clientLogs = finesse.cslogger.ClientLogger;  // declare clientLogs

            // Initiate the ClientServices and load the user object. ClientServices are
            // initialized with a reference to the current configuration.
            finesse.clientservices.ClientServices.init(cfg, false);

            // Initiate the ClientLogs. The gadget id will be logged as a part of the message
            clientLogs.init(gadgets.Hub, "uccxHybrisNexa");

            // Create a user object for this user (Call GET User)
            user = new finesse.restservices.User({
                id: cfg.id, 
                onLoad : handleUserLoad,
                onChange : handleUserChange
            });
            
            // Initiate the ContainerServices and add a handler for when the tab is visible
            // to adjust the height of this gadget in case the tab was not visible
            // when the html was rendered (adjustHeight only works when tab is visible)
            containerServices = finesse.containerservices.ContainerServices.init();
            containerServices.addHandler(finesse.containerservices.ContainerServices.Topics.ACTIVE_TAB, function() {
                clientLogs.log("Gadget is now visible");  // log to Finesse logger
                // Automatically adjust the height of the gadget to show the html
                gadgets.window.adjustHeight();
            });
            containerServices.makeActiveTabReq();
        }
    };
}(jQuery));
