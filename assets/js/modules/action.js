
import {isUndefinedOrNull,isNotUndefinedOrNull,isEmptyString} from './utils/utils.js';

export default class ACTION {
    _filter = '';
    _sf;

    set filter(filter){
        this._filter = filter;
    }
    get filter(){
        return this._filter;
    }

    constructor(_sf){
        this._sf = _sf;
    }

    get isHtml(){
        return  RegExp.prototype.test.bind(/(<([^>]+)>)/i);
    }
    
    get readOnlyHTML(){
        var html = [];
            html.push('<span class="slds-icon_container slds-icon-utility-lock">');
            html.push('<svg class="slds-icon slds-icon-text-default slds-icon_xx-small" aria-hidden="true">');
            html.push('<use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#lock"></use>');
            html.push('</svg>');
            html.push('</span>');
        return html.join('');
    }

    get formulaHTML(){
        var html = [];
            html.push('<span class="slds-icon_container slds-icon-utility-variable">');
            html.push('<svg class="slds-icon slds-icon-text-default slds-icon_xx-small" aria-hidden="true">');
            html.push('<use xlink:href="/assets/icons/utility-sprite/svg/symbols.svg#variable"></use>');
            html.push('</svg>');
            html.push('</span>');
        return html.join('');
    }

    renderAll = function(items){
        var html = [];
    
        for(var key in items){
            let completeField       = this._sf.sObject.metadata.fields.find(field => field.name == items[key].field);
                completeField.value = items[key].value;
            if(completeField.name == 'ZipCodeAssignmentKeyAuto__c'){
                console.log('field',completeField);
            }
            
            html.push('<tr style="height: 0;">');
            html.push('<td>');
            /** icon - start */
            /*if(completeField.calculated){
                html.push(this.formulaHTML);
                html.push('<span style="font-weight:Bold; margin-left:5px;">'+this.renderField(items[key].field,filter)+'</span>');
            }else */if(!completeField.updateable){
                html.push(this.readOnlyHTML);
                html.push('<span style="font-weight:Bold; margin-left:5px;">'+this.renderField(items[key].field,this._filter)+'</span>');
            }else{
                html.push('<span style="font-weight:Bold; margin-left:20px;">'+this.renderField(items[key].field,this._filter)+'</span>');
            }
            /** icon - end */
            
            html.push('</td>');
            html.push('<td>');
            html.push('<span>'+this.renderValue(completeField,this._filter)+'</span>');
            html.push('</td>');
            html.push('</tr>');
        }
        return html.join('');
    }

    renderField = (fieldName,filter) => {
        if(filter == null || filter == ''){
            return fieldName;
        }
        
        var regex = new RegExp('('+filter+')','gi');
        if(regex.test(fieldName)){
            return fieldName.toString().replace(/<?>?/,'').replace(regex,'<span style="font-weight:Bold; color:blue;">$1</span>');
        }else{
            return fieldName;
        }
    }
    
    renderValue = (completeField,filter) => {
        /** SET FIELTERED VALUE for displayed **/
        var regex = new RegExp('('+filter+')','gi');
        if(!isEmptyString(filter) && regex.test(completeField.value) && isNotUndefinedOrNull(completeField.value)){
            completeField.filteredValue = completeField.value.toString().replace(/<?>?/,'').replace(regex,'<span style="font-weight:Bold; color:blue;">$1</span>');
        }else{
            completeField.filteredValue = completeField.value == null ?' ':completeField.value;
        }
        // fix the issue with JS object (shouldn't be the case but just in case)
        if(typeof completeField.value == 'object' && completeField.value != null){
            completeField.filteredValue = JSON.stringify(completeField.value);
        }

        switch(completeField.type){
            case "reference":
                return completeField.filteredValue; // in the futur, return a link
            break;
            case 'boolean':
                return completeField.value == true ? '<img src="assets/images/checkbox_checked.gif"/>': '<img src="assets/images/checkbox_unchecked.gif"/>';
            break;
        }
    
        /** in case of HTML  **/
        if(this.isHtml(completeField.value)){
            var data = completeField.value;
            if(data.indexOf('href="//') > -1 || data.indexOf('src="//') > -1){
                balise = data;
            }else{
                var balise = data.replace(/href="\//i, 'href="https://'+this._sf.fullDomain);
                    balise = balise.replace(/src="\//i, 'src="https://'+this._sf.fullDomain);
            }
           return balise;
        }

        // otherwise just return the filteredValue
        return completeField.filteredValue;
            
    }
    
    
    sortObject = function(arr){
        return arr.sort((a,b) => {
            if(a.field < b.field){
                return -1;
            }else if(a.field > b.field){
                return 1;
            }else{
                return 0;
            }
        });
        
    };
    
    
    filtering = function(arr){
        if(this._filter == '' || this._filter == null)
            return this.sortObject(arr);
    
    
        var items = [];
        var regex = new RegExp('('+this._filter+')','i');
        for(var key in arr){
              var item = arr[key];
                if(typeof item.value == 'object'){
                    item.value = JSON.stringify(item.value);
                }
    
              if(this._filter === 'false' && item.value === false || this._filter === 'true' && item.value === true || this._filter === 'null' && item.value === null){
                  items.push(item);
                  continue;
              }
              
    
              if(item.value != false && item.value != true && regex.test(item.value) || regex.test(item.field)){
    
                  items.push(item);
                  continue;
              }
        }
        
    
       return this.sortObject(items);
    }
}

