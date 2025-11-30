#!/bin/bash

set -e

DEPLOY_TYPE=$1 # 'preview' or 'production'

if [ -z "$VERCEL_PROJECT_ID" ]; then
  echo "🔍 VERCEL_PROJECT_ID is not set. Checking if project '$VERCEL_PROJECT_NAME' exists..."
  PROJECT_INFO=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_NAME?teamId=$VERCEL_ORG_ID")
  if echo "$PROJECT_INFO" | jq -e '.id' > /dev/null; then
    export VERCEL_PROJECT_ID=$(echo "$PROJECT_INFO" | jq -r '.id')
    echo "✅ Found existing project '$VERCEL_PROJECT_NAME' with ID: $VERCEL_PROJECT_ID"
  else
    echo "🚧 Project '$VERCEL_PROJECT_NAME' not found. Creating a new Vercel project..."
    CREATE_RES=$(curl -s -X POST "https://api.vercel.com/v9/projects?teamId=$VERCEL_ORG_ID" -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" -d "{\"name\": \"$VERCEL_PROJECT_NAME\", \"buildCommand\": \"$VERCEL_BUILD_COMMAND\", \"outputDirectory\": \"$VERCEL_OUTPUT_DIR\", \"framework\": \"$VERCEL_FRAMEWORK\"}")
    echo "📦 Create Response:"
    echo "$CREATE_RES"
    NEW_PROJECT_ID=$(echo "$CREATE_RES" | jq -r '.id')
    if [ "$NEW_PROJECT_ID" = "null" ] || [ -z "$NEW_PROJECT_ID" ]; then
      echo "❌ Failed to create Vercel project. Response: $(echo "$CREATE_RES" | tr -d '\n')"
      exit 3
    fi
    export VERCEL_PROJECT_ID=$NEW_PROJECT_ID
    echo "✅ Created new Vercel project with ID: $VERCEL_PROJECT_ID"
  fi
else
  echo "🔑 Using predefined VERCEL_PROJECT_ID: $VERCEL_PROJECT_ID"
fi

# Now perform the deployment
if [ "$DEPLOY_TYPE" == "preview" ]; then
  echo "🚀 Deploying to Vercel Preview..."
  if ! DEPLOY_OUTPUT=$(VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID vercel --token $VERCEL_TOKEN --yes); then
    echo "❌ Vercel preview deployment failed."
    exit 1
  fi
  echo "$DEPLOY_OUTPUT"
  PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep "https://" | tail -n 1)
  echo "🚀 Deployed to Vercel Preview successfully ✅!"
  echo "✨ Preview URL: $PREVIEW_URL"
elif [ "$DEPLOY_TYPE" == "production" ]; then
  echo "🚀 Deploying to Vercel Production..."
  if ! VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID vercel --prod --token $VERCEL_TOKEN --yes; then
    echo "❌ Vercel production deployment failed."
    exit 1
  fi
  echo "🚀 Deployed to Vercel successfully ✅!"
  echo "✨ Production URL: https://$VERCEL_PROJECT_NAME.vercel.app"
else
  echo "❌ Invalid deployment type specified: $DEPLOY_TYPE. Must be 'preview' or 'production'."
  exit 1
fi
