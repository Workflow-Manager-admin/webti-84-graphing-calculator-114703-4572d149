#!/bin/bash
cd /home/kavia/workspace/code-generation/webti-84-graphing-calculator-114703-4572d149/calculator_frontend_workspace/calculator_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

