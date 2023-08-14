#!/usr/bin/env bash

name_suffix=${TRAVIS_JOB_ID-$USER}
name="cfp-test-${name_suffix}"

function checkenv {
    if [[ -z "$2" ]]; then
        echo "Error: missing ibmcloud '$1' env var" 1>&2
        exit 1
    fi
}

checkenv apikey $apikey
checkenv resource_group $resource_group 
checkenv vpc_id $vpc_id
checkenv ssh_key_id $ssh_key_id
checkenv subnet_id $subnet_id
checkenv security_group_id $security_group_id
checkenv ssh_key $ssh_key
checkenv class $class # gpu class
checkenv zone $zone # ibmcloud zone
checkenv endpoint $endpoint # ibmcloud iaas api endpoint
checkenv image_id $image_id

echo "Getting iam token" 1>&2
iam_token=$(curl -s -X POST 'https://iam.cloud.ibm.com/identity/token' -H 'Content-Type: application/x-www-form-urlencoded' -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=$apikey" | jq -r .access_token)

echo "Reserving virtual private server with name=$name" 1>&2
vsi_resp=$(curl -s -X POST \
              "$endpoint/v1/instances?version=2023-07-06&generation=2" \
              -H "Authorization: Bearer $iam_token" \
              -H "Content-Type: application/json" \
              -H "accept: application/json" \
              -d "{
  \"zone\": {
    \"name\": \"$zone\"
  },
  \"resource_group\": {
    \"id\": \"$resource_group\"
  },
  \"name\": \"${name}\",
  \"vpc\": {
    \"id\": \"$vpc_id\"
  },
  \"user_data\": \"\",
  \"profile\": {
    \"name\": \"$class\"
  },
  \"keys\": [
    {
      \"id\": \"$ssh_key_id\"
    }
  ],
  \"primary_network_interface\": {
    \"name\": \"eth0\",
    \"primary_ip\": {
      \"auto_delete\": true
    },
    \"allow_ip_spoofing\": false,
    \"subnet\": {
      \"id\": \"$subnet_id\"
    },
    \"security_groups\": [
      {
        \"id\": \"$security_group_id\"
      }
    ]
  },
  \"network_interfaces\": [],
  \"volume_attachments\": [],
  \"boot_volume_attachment\": {
    \"volume\": {
      \"name\": \"$name-boot\",
      \"capacity\": 250,
      \"profile\": {
        \"name\": \"10iops-tier\"
      }
    },
    \"delete_volume_on_instance_delete\": true
  },
  \"metadata_service\": {
    \"enabled\": false
  },
  \"availability_policy\": {
    \"host_failure\": \"restart\"
  },
  \"image\": {
    \"id\": \"$image_id\"
  }
}")

vsi_id=$(echo -n "$vsi_resp" | jq -r .id)
if [[ $vsi_id = null ]]; then
    echo "Error getting virtual private server $vsi_resp" 1>&2
    exit 1
else
    echo "Reserved VM with id $vsi_id" 1>&2
fi

network_interface=$(echo -n "$vsi_resp" | jq -r .network_interfaces[0].id)
if [[ $network_interface = null ]]; then
    "Error getting network interface $vsi_resp" 1>&2
    exit 1
else
    echo "Reserved VM with network interface $network_interface" 1>&2
fi

echo "Reserving floating ip" 1>&2
resp=$(curl -s -X POST \
            "$endpoint/v1/floating_ips?version=2023-07-06&generation=2" \
            -H "Authorization: Bearer $iam_token" \
            -H "Content-Type: application/json" \
            -H "accept: application/json" \
            -d "{
  \"resource_group\": {
    \"id\": \"$resource_group\"
  },
  \"name\": \"${name}\",
  \"target\": {
    \"id\": \"${network_interface}\"
  }
}")

ip_id=$(echo "$resp" | jq -r .id)
address=$(echo "$resp" | jq -r .address)

if [[ $ip_id = null ]] || [[ $address = null ]]; then
    echo "Error reserving floating ip" 1>&2
    echo "$resp" 1>&2
    exit 1
else
    echo "Reserved floating_ip $address" 1>&2
fi

echo "{\"vsi_id\":\"$vsi_id\",\"ip_id\":\"$ip_id\",\"ip\":\"$address\",\"endpoint\":\"$endpoint\"}"
