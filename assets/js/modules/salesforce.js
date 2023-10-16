/*global chrome*/

import {isUndefinedOrNull,isNotUndefinedOrNull,isEmptyString} from './utils/utils.js';
import RECORD from "./record.js";
export default class SALESFORCE {

    constructor(){
        
        this.counter        = 0;
        this.sessionId      = null;
        this.client         = null;
        this.sObject        = new RECORD();
        this.fullDomain     = null;
        this.subDomain      = null;
        this.isLightning    = false;
        
    }

    init(url){
        let _defer = Q.defer();
        let matching = url.match(/https:\/\/(.*)(\.lightning\.force\.com|\.salesforce\.com)(.*\/)([0-9A-Za-z]{15,18})\\??.*$/);
        if(matching != null){
            this.recordId = matching[4];
        }else{
            matching =  url.match(/https:\/\/(.*)(\.lightning\.force\.com|\.salesforce\.com)(.*\/)\\??.*$/);
            this.recordId = null;
        }
        this.instance = matching[1];

        this.domain   = null;
        if(matching[2].includes('lightning.force.com')){
            // Lightning mod
            this.isLightning = true;
            this.subDomain = matching[1];
            this.fullDomain = matching[1]+'.my.salesforce.com';
            this.domain = 'my.salesforce.com'
        }else{
            // Classic mod
            this.subDomain  = matching[1];
            this.fullDomain = matching[1]+matching[2];
            this.domain     = matching[2];
        }


        console.log('Init salesforce UTIL');
        this.getSessiongId()
        .then(res => {
            console.log('res',res);
           
            this.sessionId = res;
            this.client = new jsforce.Connection({
                serverUrl : 'https://' + this.fullDomain,
                sessionId : res
            })




            //console.log(self.client);
            return this.getCurrentObjectType();
        })
        .then(res => {
            return this.getOrgId();
        })
        .then(res => {
            return this.getSObjectFieldsV2();
        })
        .then(res => {
            _defer.resolve();
        })
        .catch(error => {
            console.log('ERROR',error);
            _defer.reject(error);
        })

        return _defer.promise;
    }

    getOrgId(){
        console.log('getOrgId');
        let _defer = Q.defer();

        this.client.query("select id, instancename from organization limit 1", (err, results) => {
            if (err) {
                console.error(err);
                return _defer.reject(err);
            }else{
                console.log('results',results);
                this.client._orgId = results.records[0].Id;

                console.log('client._orgId',this.client._orgId);
                return _defer.resolve();
            }
        });
        return _defer.promise;
    }
    /** TODO **/
    getDebugLevels(){
        let _defer = Q.defer();
        this.client.tooling.sobject('DebugLevel').find().execute((err, records) =>{
            if (err) {
                console.error(err);
                return _defer.reject(err);
            }else{
                this.client._debugLevels = records;
                return _defer.resolve();
            }
        });
        return _defer.promise;
    }


    getSessiongId(){
        let _defer = Q.defer();
        if(this.sessionId === null){
            this.getCookie('sid')
            .then(function(cookie){
                _defer.resolve(cookie);
            })
            .catch(function(error){
                _defer.reject(error);
            })
        }else{
            console.log('Get SessionId');
            _defer.resolve(this.sessionId);
        }

        return _defer.promise;
    }

    getCookie(name){
        let _defer = Q.defer();
        var domain = this.fullDomain;

        var returnCookie = (cookie) => {
            console.log(cookie);
            if(cookie === null || cookie === undefined){
                _defer.reject({result:'Error: cookie is wrong'});
            }else{
                _defer.resolve(cookie);
            }
        }

        if(chrome !== undefined && chrome.cookies !== undefined){
            //console.log({"url":url, "name":name})

            chrome.tabs.query({"status":"complete","windowId":chrome.windows.WINDOW_ID_CURRENT,"active":true}, (tab) =>{
                    //console.log('debuginin !!!');
                    //console.log(JSON.stringify(tab));
                    //console.log('tab[0].url',tab[0].url);
                    //console.log(this.fullDomain);
                    chrome.cookies.getAll({"domain":this.fullDomain},(cookies) => {
                        let sid = cookies.find(item => item.name == 'sid');
                        console.log('sid',sid.value);
                        returnCookie(sid.value);
                    });
            });
            
        }else{

                // 
                //      ONLY FOR LOCAL TESTING
                //
            returnCookie('00D25000000E1zh!ARwAQM.G9KcvfzZ_C5Cw5svcff0Lc1qBXJdJcizDnlrIZXGYj0vU2TPRjGP5hWfgyRhTn3r6.PtplvXsVAZv1UmgONiFybA_');
        }
            

        return _defer.promise;
    }

    getCurrentObjectType(){
        let _defer = Q.defer();

        this.client.tooling.executeAnonymous("ID a='" + this.recordId + "';Integer.valueOf(String.valueOf(a.getSObjectType()));", (err, res) => {
            if (err) { 
                console.log('err',err.message);
                _defer.reject(err); 
            }else{
                console.log('res',res);
                let _sobjectString = res.exceptionMessage.replace(/^.* (.*)$/,'$1');
                this.sObjectType    = _sobjectString == 'null'?null:_sobjectString;
                _defer.resolve();
            }
           
          });

        return _defer.promise;
    }

    fetch_metadata(){
        console.log('--> fetch_metadata');
        let _defer = Q.defer();
        this.client.sobject(this.sObjectType).describe((err, meta) => {
            if (err) {
                _defer.reject(err);
            }else{
                this.sObject.metadata = meta;
                _defer.resolve(); 
            }
          });
		return _defer.promise;
    }
    
    fetch_data(){
        console.log('--> fetch_data');

        let _defer = Q.defer();
        this.client.sobject(this.sObjectType).retrieve(this.recordId, (err, sObject) =>{
            if (err) {
                _defer.reject(err);
            }else{
                this.sObject.data = sObject;
                _defer.resolve();
            }
        });
        return _defer.promise;
    }

    fetch_users(){
        let _defer = Q.defer();
        let query = 'SELECT Id,IsActive,Name,Email,Profile.Name,LastLoginDate from User limit 5000';
        console.log('query',query);
        this.client.query(query,
            (err, res) => {
                if (err) {
                    console.error(err);
                    _defer.reject(err);
                }else{
                    console.log('size - '+res.records.length);
                    _defer.resolve(res.records);
                }
            }
        );
        return _defer.promise;
    }
    search_users(search_text){
        let _defer = Q.defer();
        let query = `FIND {${search_text}*} IN ALL FIELDS RETURNING User(Id, Name,Email,Profile.Name,LastLoginDate)`;
        console.log('query',query);
        this.client.search(query,
            (err, res) => {
                if (err) {
                    _defer.reject(err);
                }else{
                    console.log('Size : '+res.searchRecords.length);
                    _defer.resolve(res.searchRecords);
                }
            }
        );


        return _defer.promise;
    }

    


	getSObjectFieldsV2(){
        console.log('getSObjectFieldsV2');
        let _defer = Q.defer();

        if( this.recordId == null){
            _defer.resolve();
        }else{
            Q.all([
                this.fetch_metadata(),
                this.fetch_data()
            ]).then(results => {
                _defer.resolve();
            })
            .catch(function (errors) {
                _defer.reject(errors);
            })
        }



        return _defer.promise;

	}

}