

import {isUndefinedOrNull,isNotUndefinedOrNull,isEmptyString} from './utils/utils.js';

export default class USER {

    _sf;
    _users = [];

    constructor(sf){
        this._sf = sf;
    }

    initMenu = () => {
        console.log('initMenu');
        //
        let html = [];
        html.push(
        `<li class="slds-dropdown__item" role="presentation">
            <a href="${this._sf.client.instanceUrl}/setup/ui/listApexTraces.apexp" role="menuitem" target="_blank">
                <span class="slds-truncate" title="View">Debug logs</span>
            </a>
        </li>`
        );

        $('#user-menu').html(html.join(''));
    }



    renderRow = (fieldName,filter) => {
        if(filter == null || filter == ''){
            return fieldName;
        }
        let regex = new RegExp('('+filter+')','gi');
        if(regex.test(fieldName)){
            return fieldName.toString().replace(/<?>?/,'').replace(regex,'<span style="font-weight:Bold; color:blue;">$1</span>');
        }else{
            return fieldName;
        }
    }

    loadAllUsers = () => {
        console.log('loadAllUsers init');
        this._sf.fetch_users()
        .then(res => {
            console.log('loadAllUsers res',res);
            this._users = res || [];

            // display the first 20 users
            let total = this._users.length > 20 ? 20 : this._users.length;
            let arr = this._users.slice(0, total);
            $('#user-toDisplay').html(this.renderAll(arr));
        })
        .catch(err => {
            console.error(err);
        })
    }

    searchUsers = (search_text) => {
        search_text = search_text || '';
        let result = this.filtering(search_text.trim());
        console.log('result',result);
        //let total =result.length > 20 ? 20 : result.length;
        //let arr = result.slice(0, total);
        $('#user-toDisplay').html(this.renderAll(result));

    }
    /** TODO **/
    addDebugUser = (id, debugLevelId) =>{


        let _defer = Q.defer();

        //setup dates
        let start = new Date();
        let end = new Date();
        end.setHours(end.getHours()+1);

        //create traceflag
        this._sf.client.tooling.sobject('TraceFlag').create({
            DebugLevelId: debugLevelId,
            ExpirationDate: end.toISOString(),
            LogType: 'USER_DEBUG',
            StartDate: start.toISOString(),
            TracedEntityId: id
        }, function(err, result){
            if(err) {
                _defer.reject(err);
            }
            else{
                _defer.resolve(result);
            }
        });

        return _defer.promise;
    }


    generateLoginUrl = function(item){
        return `${this._sf.client.instanceUrl}/servlet/servlet.su?oid=${this._sf.client._orgId}&suorgadminid=${item.Id}&retURL=%2Fhome%2Fhome.jsp&targetURL=%2Fhome%2Fhome.jsp`;
    }

    generateViewUrl = function(item){
        return `${this._sf.client.instanceUrl}/${item.Id}`;
    }

    renderAll = function(items){
        let html = [];

        items.forEach(item => {
            html.push(`
                <tr style="height: 0;">
                    <td><span>${item.IsActive?'<img src="assets/images/checkbox_checked.gif"/>':'<img src="assets/images/checkbox_unchecked.gif"/>'}</span></td>
                    <td><span style="font-weight:Bold; margin-left:5px;">${item.Name}</span></td>
                    ${item.Email.includes('.invalid')?
                        `<td class="email-invalid"><span>${item.Email}</span></td>`:
                        `<td><span>${item.Email}</span></td>`
                    }
                    <td><span>${item.Profile != undefined ?item.Profile.Name:''}</span></td>
                    <td><span>${isNotUndefinedOrNull(item.LastLoginDate)?item.LastLoginDate:''}</span></td>
                    <td class="exclude-overflow">
                        <div class="slds-dropdown-trigger slds-dropdown-trigger--click" style="float: right;">
                            <button class="slds-button slds-button_icon slds-button_icon-border-filled" aria-haspopup="true" title="Show More">
                                <svg class="slds-button__icon" aria-hidden="true">
                                    <use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#down"></use>
                                </svg>
                                <span class="slds-assistive-text">Show More</span>
                            </button>
                            <div class="slds-dropdown slds-dropdown_right">
                                <ul class="slds-dropdown__list" role="menu" aria-label="Show More">
                                    <li class="slds-dropdown__item" role="presentation">
                                       <a href="${this.generateLoginUrl(item)}" role="menuitem" target="_blank">
                                            <span class="slds-truncate" title="View">Login</span>
                                        </a>
                                    </li>
                                    <li class="slds-dropdown__item" role="presentation">
                                        <a href="${this.generateViewUrl(item)}" role="menuitem" target="_blank">
                                            <span class="slds-truncate" title="View">View</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            `);
        });
        //this.renderField(items[key].field,filter)
        return html.join('');
    }

    sortObject = function(arr){
        return arr.sort((a,b) => {
            if(a.Name < b.Name){
                return -1;
            }else if(a.Name > b.Name){
                return 1;
            }else{
                return 0;
            }
        });

    };

    filtering = (filter) =>{
        if(isNotUndefinedOrNull(filter) && filter.length >= 3){
            console.log('this._users',this._users);
            console.log(this._users.filter(item => item.Name.includes(filter)));
            let arr = this._users.filter(item => item.Name.includes(filter) || item.Email.includes(filter));
            return this.sortObject(arr);
        }else{
            return [];
        }
    }

}