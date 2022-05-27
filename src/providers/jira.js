import { 
    camelToSnake,
} from '../shared-functions.js';

function getJiraServiceName(serviceName){
    switch(serviceName) {
        case 'applicationrole':
            return 'application_role';
        case 'fieldconfiguration':
            return 'field_configuration';
        case 'fieldconfigurationscheme':
            return 'field_configuration_scheme';                         
        case 'groupuserpicker':
            return 'group_user_picker';
        case 'issuesecurityschemes':
            return 'issue_security_schemes';
        case 'issuetype':
            return 'issue_type';
        case 'issuetypescheme':
            return 'issue_type_scheme';
        case 'issuetypescreenscheme':
            return 'issue_type_screen_scheme';
        case 'mypermissions':
            return 'my_permissions';
        case 'mypreferences':
            return 'my_preferences';
        case 'notificationscheme':
            return 'notification_scheme';
        case 'permissionscheme':
            return 'permission_scheme';
        case 'projectvalidate':
            return 'project_validate';
        case 'screenscheme':
            return 'screen_scheme';
        case 'securitylevel':
            return 'security_level';
        case 'statuscategory':
            return 'status_category';
        case 'workflowscheme':
            return 'workflow_scheme';            
        default:
            return camelToSnake(serviceName);
    };
}

function getJiraServiceDesc(){
    return false;
}

export {
    getJiraServiceName,
    getJiraServiceDesc,
  }