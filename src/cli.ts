#!/usr/bin/env node
import { Laminar } from "@lmnr-ai/lmnr";
import { render } from "ink";
import React from "react";
import { App } from "./ui/index.tsx";

Laminar.initialize({
  projectApiKey: process.env.LMNR_PROJECT_API_KEY,
});

render(React.createElement(App));
