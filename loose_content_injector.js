function LooseContentInjector(injectorName, injectionInterval_ms) {

    var _contentItems = [];

    var _injectCallback = null;

    this.inject = function(callback) {
        console.log('LCI [' + injectorName + ']: Injecting...');
        injectLoop();
    };

    this.ContentItem = function() {

        var instance = this;

        this.name = null;
        this.inject = null;
        this.callback = null;
        this.canLoadCheck = null;
        this.isLoadedCheck = null;

        this.failures = 0;
        this.failureLimit = 250;
        this.lastError = null;

        this.isFailed = function(){ return instance.failures >= instance.failureLimit; };
        this.isLoaded = function(){
            try{
                return instance.isLoadedCheck();
            }
            catch(e) {
                instance.lastError = e;
                return false;
            }
        };
        this.isCompleted = function () {
            return instance.isFailed() || instance.isLoaded();
        };

    };

    this.addContentItem = function(contentItem){
        _contentItems.push(contentItem);
    };

    function isComplete() {
        for(var i = 0; i < _contentItems.length; i++){
            if(!_contentItems[i].isCompleted()){
                return false;
            }
        }
        return true;
    }

    function sendInjectCallback() {
        if (typeof(_injectCallback) === 'function') {
            _injectCallback();
        }
    }
    function sendContentCallback(contentItem) {
        if (typeof(contentItem.callback) === 'function') {
            contentItem.callback(contentItem);
        }
    }

    function injectLoop() {

        for(var index = 0; index < _contentItems.length; index++){
            var ci = _contentItems[index];

            if(ci.isCompleted()){ continue; }


            if(ci.canLoadCheck()) {
                ci.inject();
                if (!ci.isLoaded()) {
                    ci.failures++;
                    ci.lastError = "Injection check failed.";
                }
            }
            else{
                ci.failures++;
                ci.lastError = "Injection conditions not met.";
            }

            if(ci.isCompleted()){

                var msg = null;
                if(ci.isFailed()){
                    msg = 'Injection failed. (' + ci.lastError + ')'
                }
                else{
                    msg = 'Injection success.';
                }

                console.log('LCI [' + injectorName + '][' + ci.name + ']: ' + msg);

                sendContentCallback(ci);
            }

        }
        if(isComplete()){
            var loadedCount = 0;
            for(var i = 0; i < _contentItems.length; i++){
                if(_contentItems[i].isLoaded()){
                    loadedCount++;
                }
            }
            console.log('LCI [' + injectorName + ']: Injected. (' + loadedCount + '/' + _contentItems.length + ')');
            sendInjectCallback();
        }
        else{
            setTimeout(injectLoop, injectionInterval_ms);
        }
    }
}