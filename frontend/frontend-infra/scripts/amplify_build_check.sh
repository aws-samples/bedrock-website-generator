#!/bin/bash

# Set your Amplify app ID and branch name
APP_ID=$(aws ssm get-parameter --name /amplify/app/id --query 'Parameter.Value' --output text)
BRANCH_NAME="main"

echo "The APP_ID is: $APP_ID"

# Get the latest job for the specified app and branch
latest_job=$(aws amplify list-jobs --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --query "jobSummaries[0].jobId" --output text)

# Check if the latest job exists
if [ -z "$latest_job" ]; then
  echo "No deployment jobs found for app $APP_ID and branch $BRANCH_NAME."
  exit 1
fi

while true; do
  # Get the status of the latest job
  status=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$latest_job" --query "job.summary.status" --output text)

  # Print the job status
  echo "Latest job status: $status"

  case $status in
    "PENDING" | "RUNNING")
      # Sleep for a while before checking again
      sleep 3
      ;;
    "SUCCEED")
      echo "Build job succeeded!"
      # Add your additional build commands here if needed
      exit 0
      ;;
    "FAILED")
      echo "Build job failed!"
      exit 1
      ;;
    *)
      echo "Unexpected status: $status"
      exit 1
      ;;
  esac
done
