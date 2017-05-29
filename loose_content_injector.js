function LooseContentInjector(injectorName, injectionInterval_ms) {

    var instance = this;

    var _contentItems = [];
    var _injectCallback = null;

    var canceled = false;

    var hasError = false;
    var errorMessage = null;

    this.inject = function(callback) {
        _injectCallback = callback;
        console.log('LCI [' + injectorName + ']: Injecting...');
        injectLoop();
    };
    this.cancelInjection = function(){
        canceled = true;
    };

    this.hasError = function(){
        return hasError;
    };
    this.getError = function(){
        return errorMessage;
    };

    this.ContentItem = function() {

        var instance = this;

        this.required = false;

        this.name = null;
        this.inject = null;
        this.callback = null;
        this.canInject = null;
        this.isInjected = null;

        this.failures = 0;
        this.failureLimit = 250;
        this.lastError = null;

        this.isFailed = function(){ return instance.failures >= instance.failureLimit; };
        this.canInject = function(){
            try{
                return instance.canInject();
            }
            catch(e) {
                instance.lastError = e;
                return false;
            }
        };
        this.isCompleted = function () {
            return instance.isFailed() || instance.isInjected();
        };
        this.reset = function(){

            instance.failures = 0;
            instance.failureLimit = 250;
            instance.lastError = null;

        };

    };
    this.addContentItem = function(contentItem){
        _contentItems.push(contentItem);
    };
    this.removeContentItem = function(contentItem){
        var index;
        if((index = _contentItems.indexOf(contentItem)) > -1){
            _contentItems.splice(index, 1);
        }
    };

    this.isCanceled = function(){
        return canceled;
    };

    this.isComplete = function() {
        if(instance.isCanceled() || instance.error){
            return true;
        }
        for(var i = 0; i < _contentItems.length; i++){
            if(!_contentItems[i].isCompleted()){
                return false;
            }
        }
        return true;
    };

    this.reset = function(){
        for(var i = 0; i < _contentItems.length; i++){
            _contentItems[i].reset();
        }
    };

    function sendInjectCallback(success) {
        if (typeof(_injectCallback) === 'function') {
            _injectCallback(success);
        }
    }
    function sendContentCallback(contentItem) {
        if (typeof(contentItem.callback) === 'function') {
            contentItem.callback(contentItem);
        }
    }
    function sendCompleted(){

        var loadedCount = 0;

        for(var i = 0; i < _contentItems.length; i++){
            if(_contentItems[i].isInjected()){
                loadedCount++;
            }
        }

        if(instance.error){
            if(instance.errorMessage === null){
                instance.errorMessage = 'Unknown error occurred';
            }
            sendInjectCallback(false);
        }
        else if(canceled){
            console.log('LCI [' + injectorName + ']: Injection Canceled. (' + loadedCount + '/' + _contentItems.length + ')');
            sendInjectCallback(false);
        }
        else{
            console.log('LCI [' + injectorName + ']: Injected. (' + loadedCount + '/' + _contentItems.length + ')');
            sendInjectCallback(true);
        }
    }

    function injectLoop() {

        for(var index = 0; index < _contentItems.length; index++){
            var ci = _contentItems[index];

            if(ci.isCompleted()){ continue; }


            if(ci.canInject()) {
                ci.inject();
                if (!ci.isInjected()) {
                    ci.failures++;
                    ci.lastError = "Injection check failed";
                }
            }
            else{
                ci.failures++;
                ci.lastError = "Injection conditions not met";
            }

            if(ci.isCompleted()){

                var preText = 'LCI [' + injectorName + '][' + ci.name + ']: ';
                if(ci.isFailed()){
                    console.log(preText + 'Injection failed. (' + ci.lastError + ')');
                    if(ci.required){
                        instance.error = true;
                        instance.errorMessage = 'A Required injection failed.';
                    }
                }
                else{
                    console.log(preText + 'Injection success. ');
                }
                sendContentCallback(ci);
            }
        }
        if(instance.isComplete()){
            sendCompleted();
        }
        else{
            setTimeout(injectLoop, injectionInterval_ms);
        }
    }
}