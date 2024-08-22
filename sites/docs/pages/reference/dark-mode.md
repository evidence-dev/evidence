
# Dark Mode 

Invoked by setting the `experimentalDarkMode` prop on a project's layout. 


## CSS Variables: 

1. Background, foreground, muted foreground etc. 
1. Can be invoked in _both_ tailwind classes and in css variables 

## Mode Watcher 

1. Store which gives the current mode
1. Switch in the layout 


## Echarts dark theme: 

1. Detects the mode of the page, and toggles between themes in the main echarts action 

## All UI components and inputs, most of datatable, most charts updated to support the dark mode 






# More to do 

* Prism theme 
* Prevent print in dark 
* Dropped reference lines 
* Calendar heatmap empty state 
* data table pagination Shifting on hover 
* Refactor atoms/button 
* Improve styling on atoms/tabs 
* Users should be able to provide a light and dark mode wordmark 