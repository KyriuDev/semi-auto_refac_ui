#!/bin/bash

cd ~/IdeaProjects/step-by-step_refactoring;
./gradlew shadowJar;
rm /home/quentin/Documents/semi-auto_refac_ui/public/refactoring.jar;
mv build/libs/multi_refactoring-1.0-SNAPSHOT-all.jar /home/quentin/Documents/semi-auto_refac_ui/public/refactoring.jar;
