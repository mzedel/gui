// Copyright 2023 Northern.tech AS
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
import { createSlice } from '@reduxjs/toolkit';

import * as onboardingConstants from './constants';
import * as onboardingSelectors from './selectors';

export const sliceName = 'onboarding';

export const initialState = {
  approach: null,
  artifactIncluded: null,
  complete: false,
  deviceType: null,
  demoArtifactPort: 85,
  progress: null,
  showCreateArtifactDialog: false,
  showTips: null,
  showTipsDialog: false
};

export const onboardingSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setDemoArtifactPort: (state, action) => {
      state.demoArtifactPort = action.payload;
    },
    setShowCreateArtifact: (state, action) => {
      state.showCreateArtifactDialog = action.payload;
    },
    setShowOnboardingHelp: (state, action) => {
      state.showTips = action.payload;
    },
    setShowOnboardingHelpDialog: (state, action) => {
      state.showTipsDialog = action.payload;
    },
    setOnboardingComplete: (state, action) => {
      state.complete = action.payload;
    },
    setOnboardingProgress: (state, action) => {
      state.progress = action.payload;
    },
    setOnboardingDeviceType: (state, action) => {
      state.deviceType = action.payload;
    },
    setOnboardingApproach: (state, action) => {
      state.approach = action.payload;
    },
    setOnboardingArtifactIncluded: (state, action) => {
      state.artifactIncluded = action.payload;
    }
  }
});

export const actions = onboardingSlice.actions;
export const constants = onboardingConstants;
export const selectors = onboardingSelectors;
export default onboardingSlice.reducer;
