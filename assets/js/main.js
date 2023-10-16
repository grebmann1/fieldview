


import SALESFORCE   from "./modules/salesforce.js";
import ACTION       from "./modules/action.js";
import USER         from "./modules/user.js";
import {isNotUndefinedOrNull} from './modules/utils/utils.js';


var _sf,_action,_user;
var items;
var filter = '';

$(document).ready(function() {
    _sf     = new SALESFORCE();
    _user   = new USER(_sf);
    _action = new ACTION(_sf);
    $('#data-search').focus();




    chrome?.tabs?.getSelected(null, (tab)=> {
        console.log(tab);
        _sf.init(tab.url)
            .then(() => {
                console.log('_sf.sObjectType',_sf.sObjectType);
                if(isNotUndefinedOrNull(_sf.sObjectType)){
                    console.log(_sf.sObject);
                    $('#title').html(_sf.sObjectType+' ('+_sf.sObject.metadata.label+')');
                    let _items = [];
                    for(var key in _sf.sObject.data){
                        if( key == 'attributes') continue;

                        var value = _sf.sObject.data[key];
                        //   console.log($.type(value))
                        _items.push({'field':key,'value':value});
                    }
                    items = _items;
                    console.log(_sf.sObject);
                    $('#data-toDisplay').html(_action.renderAll(_action.filtering(items)));
                }



                // load users
                _user.loadAllUsers();
                _user.initMenu();
            }).catch(err => {
            console.error(err);
        })
    });


    let handleSearchData = function(){
        _action.filter = this.value;
        $('#data-toDisplay').html(_action.renderAll(_action.filtering(items)));
    }

    let handleMenuItemClick = function(){
        let action = $(this).data('action');
        console.log(`onclickbutton : ${action}`);

        switch (action) {
            case 'user':
                $('#title').html('User');
            break;

            case 'data':
                $('#title').html(_sf.sObjectType+' ('+_sf.sObject.metadata.label+')');
            break;
        }


        // unselect all items
        $('.menu-item').each(function( index, element ){
            $(this).removeClass('slds-is-selected');
        })
        $('.container').each(function(index,element){
            $(this).addClass('slds-hide');
        });

        // show the selected one !
        $(this).addClass('slds-is-selected');
        $('.container-'+action).first().removeClass('slds-hide');

    }
    /*
        let delay = function(callback, ms) {
            let timer = 0;
            return function() {
                let context = this, args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function () {
                    callback.apply(context, args);
                }, ms || 0);
            };
        }
    */
    /** ACTIONS **/

    $('body').on('click','.slds-dropdown-trigger--click',function(){
        console.log('On click drop down');
        let menu = $(this).closest('.slds-dropdown-trigger');
        if(menu.hasClass('slds-is-open')){
            menu.removeClass('slds-is-open');
        }
        else{
            menu.addClass('slds-is-open');
        }
    })


    $('.menu-item').on('click',handleMenuItemClick);

    $('#data-search').keyup(handleSearchData);

    $('#user-search').keyup(function(e){
        if (e.keyCode == 13){
            _user.searchUsers(this.value);
        }
    });



})




