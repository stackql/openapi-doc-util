

function getAzureOpObjectKey(service, resource, verbKey){
    let objectKey = 'none';

    if (verbKey === 'get'){
        // default to jsonpath to 'value'
        objectKey = '$.value';

        // override defaults where needed
        if (service === 'ad_hybrid_health_service'){
            if (resource === 'ip_address_aggregate_settings'){
                objectKey = 'none';
            }
        } else if (service === 'api_management'){
            if (resource === 'network_status'){
                objectKey = 'none';
            }
        } else if (service === 'application_insights'){
            if (resource === 'analytics_items' || 
                resource === 'export_configurations' || 
                resource === 'favorites' || 
                resource === 'proactive_detection_configurations'){
                    objectKey = 'none';
            }
        } else if (service === 'automation'){
            if (resource === 'network_status'){
                objectKey = '$.keys';
            } else if (resource === 'keys'){
                objectKey = 'none';
            }
        } else if (service === 'azure_stack'){
            if (resource === 'cloud_manifest_file'){
                objectKey = 'none';
            }
        } else if (service === 'compute'){
            if (resource === 'virtual_machine_images' || 
                resource === 'virtual_machine_images_edge_zone' || 
                resource === 'shared_galleries'){
                    objectKey = 'none';
            }
        } else if (service === 'compute_admin'){
            if (resource === 'platform_images' || 
                resource === 'vm_extensions'){
                    objectKey = 'none';
            }
        } else if (service === 'databricks'){
            if (resource === 'outbound_network_dependencies_endpoints'){
                objectKey = 'none';
            }
        } else if (service === 'deployment_admin'){
            if (resource === 'action_plan_operation_attempt'){
                objectKey = 'none';
            }
        } else if (service === 'deployment_manager'){
            if (resource === 'rollouts' || 
                resource === 'artifact_sources' || 
                resource === 'service_topologies' || 
                resource === 'service_units' || 
                resource === 'services' || 
                resource === 'steps'){
                    objectKey = 'none';
            }
        } else if (service === 'elastic'){
            if (resource === 'deployment_info'){
                objectKey = 'none';
            }
        } else if (service === 'engagement_fabric'){
            if (resource === 'accounts'){
                objectKey = 'none';
            }
        } else if (service === 'hdinsight'){
            if (resource === 'configurations'){
                objectKey = 'none';
            }
        } else if (service === 'iot_hub'){
            if (resource === 'private_endpoint_connections'){
                objectKey = 'none';
            }
        } else if (service === 'marketplace_ordering'){
            if (resource === 'marketplace_agreements'){
                objectKey = 'none';
            }    
        } else if (service === 'network'){
            if (resource === 'firewall_policy_idps_signatures' || 
                resource === 'firewall_policy_idps_signatures_filter_values' || 
                resource === 'service_tags'){
                    objectKey = 'none';
            }
        } else if (service === 'operational_insights'){
            if (resource === 'available_service_tiers' || resource === 'intelligence_packs'){
                objectKey = 'none';
            }
        } else if (service === 'peering'){
            if (resource === 'service_countries'){
                objectKey = 'none';
            }
        } else if (service === 'powerbi_privatelinks'){
            if (resource === 'power_bi_resources' || 
                resource === 'private_link_services' || 
                resource === 'private_link_services_for_power_bi'){
                    objectKey = 'none';
            }
        } else if (service === 'provider_hub'){
            if (resource === 'operations'){
                objectKey = 'none';
            }
        } else if (service === 'security'){
            if (resource === 'external_security_solutions'){
                objectKey = 'none';
            }
        } else if (service === 'service_fabric_managed_clusters'){
            if (resource === 'managed_cluster_version'){
                objectKey = 'none';
            }
        } else if (service === 'sql'){
            if (resource === 'capabilities' || 
                resource === 'database_advisors' || 
                resource === 'database_recommended_actions' || 
                resource === 'server_advisors' ||
                resource === 'database_schemas' ||
                resource === 'job_versions' ||
                resource === 'managed_database_schemas'){
                    objectKey = 'none';
            }
        } else if (service === 'synapse'){
            if (resource === 'integration_runtime_auth_keys' || 
                resource === 'integration_runtime_monitoring_data' || 
                resource === 'operations' ||
                resource === 'sql_pool_schemas' ||
                resource === 'sql_pool_tables'){
                    objectKey = 'none';
            }
        }
    }
    
    return objectKey;
}

export { 
    getAzureOpObjectKey,
};