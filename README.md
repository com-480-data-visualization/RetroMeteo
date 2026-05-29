# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Gaspard Héliot | 356481 |
| Noa Cuccodoro | 355700|
| Thomas Kemper | 330032|

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

We have selected the ***"All measurement values for a station"*** dataset via the ***OpenSwissData STAC Browser***. This comprehensive archive aggregates high-resolution meteorological measurements from automatic weather stations across Switzerland spanning the last 30 years.

Data Quality and Preprocessing:
The dataset is highly structured and maintained by Federal authorities, ensuring high reliability. However, we anticipate a preprocessing phase to:

Aggregate temporal data: Converting raw hourly/daily measurements into meaningful annual or seasonal trends.
Handle Missing Values: Some stations lack some measurements because of the absence of some sensors.
Station mapping: Visualizing station locations


### Problematic

Research Question: How has the Swiss climate landscape shifted over the last three decades, and which regions are most impacted by these changes?

Project Overview & Motivation:
Switzerland’s diverse topography makes it a unique laboratory for climate study. Our goal is to move beyond static charts by building an interactive spatio-temporal dashboard. We want to empower users to visualize the evolution of weather measurement across Switzerland through the last 30 to 45 years.

Target Audience:
The tool is designed for curious citizens and educators in Switzerland who want a data-driven localized perspective on climate change rather than global averages.

### Exploratory Data Analysis

After combining in R the datasets of the 12 swiss weather stations, we have a dataset with the following basic statistics by variables: 

![image1](https://github.com/com-480-data-visualization/RetroMeteo/blob/master/images/basic_stats.png)

All the weather stations didn’t always have the same measurements available, which explains the large quantity of NA’s for a lot of precise measurements. In total, after the merging, we have 412256 data points\! Of course, not all will be relevant for our analysis, but the main measurements, such as temperature, sunshine, wind or NO concentration will be the variables on which we’ll focus our visualisations.

Our initial Exploratory Data Analysis focuses on seeing whether or not some metrics follow a trend across the last 30 to 45 years. The following plots explore this idea really basically, taking only the measurements from the Aigle station:

![image2](https://github.com/com-480-data-visualization/RetroMeteo/blob/master/images/temp_over_years.png)
![image3](https://github.com/com-480-data-visualization/RetroMeteo/blob/master/images/temp_evo_different_months.png)
![image4](https://github.com/com-480-data-visualization/RetroMeteo/blob/master/images/precipitation_over_years.png)

### Related work


Inspiration:
* Our primary visual benchmark is the MeteoSwiss mobile application and web portal. While MeteoSwiss excels at real-time forecasting, our approach shifts the focus toward historical storytelling.
* Long-term global temperature trends, such as those presented by [Climate.gov](https://www.climate.gov/news-features/understanding-climate/climate-change-global-temperature) which highlight changes in average surface temperature.
* Interactive climate maps from [OpenClimateMap](https://openclimatemap.org), enabling exploration of historical variations across regions.
* Real-time weather visualizations from [OpenWeatherMap](https://openweathermap.org/weathermap).

Originality:
Most existing Swiss weather tools are either focused on the now (forecasts) or are dense, non-interactive scientific reports. Our project bridges this gap by introducing an interactive tool to study the trends related to diverse weather measurements across the last 30 to 40 years.



## Milestone 2 (17th April, 5pm)

**10% of the final grade**

**Overview of the visualizations**  
   
Let us guide you through the experience of *RetroMeteo* (or at least what we plan it to be\!). 

_Screen 1:_

When arriving on the website, you should have a minimalist version of a swiss map with multiple points representing the weather stations we gathered the data from (screen 1 of the sketch). A short text appears telling you to try to click on a weather station. When hovering over a station, a little photo of the surroundings of the station will appear with a very simple description of the location (e.g. canton, elevation, …). At this stage, we can’t scroll down, the screen 2 and 3 did not yet appear, to avoid having the user lost. We may implement a possibility of zooming in and out on the map, using the lecture we’ll have next week about maps (so using the tile organization). Now, when the user clicks on a station, it lights up, and an effect guides the user by slightly scrolling down, revealing the screen 2\.

_Screen 2:_

On the top left corner of screen 2, the name of the station appears, and on the opposite corner, on the right, the photo of the surroundings (in a vignette format). The core part of this screen is then a table that displays the name of all the available variables for this specific station. After each name, a little (i) in a circle lets the user hover over it to have a brief description of what this variable is. Now, when the user clicks on a variable name, it lights up, and an effect guides the user by slightly scrolling down, revealing the screen 3, the last one.

_Screen 3:_

Here we are on the most important screen, the data screen\! After selecting the station and variable the user was interested in, he now has multiple ways of interacting with it to get insightful information. On the top left corner of screen 3, the name of the variable appears, with a (i) next to it. When clicking on this (i), information about the protocol to collect the data is displayed, along with some important facts to better understand how to interpret the values of the table. On the center of screen 3, the table of the asked station \+ variable is displayed. Over it, the time period of the table. Beneath, multiple ways to choose what length of time period interests the user, and when he wants to begin and end it. 

![image5](https://github.com/com-480-data-visualization/RetroMeteo/blob/master/images/milestone2_sketch.jpeg)

**A few words about the project**

Aside from the visualization per se, another challenging aspect of our work will be to cut out all of our data, and to correctly implement the algorithm to navigate on the time periods. We know that this course is not a data science class, and thus the emphasis is on the visual part, but it is worth mentioning that the software architecture of this project will be at least as interesting and time consuming\! 

**Our prototype** 

Our prototype is a mixture of the 3 screens described above. The main part of the screen is equivalent to screen 1 being a map of Switzerland, similar to the one used in MeteoSwiss. On the left is the equivalent of screen 2, a quick overview of the station’s data along with the choice of metric to see. Finally at the bottom is the equivalent of screen 3 with the graph of the selected metric. For now these graphs are just sinusoid and don’t reflect our dataset.   

**Tools**  
	  
For the map layer, we use [Leaflet.js](http://Leaflet.js) which handles the tile rendering, marker placement and tooltips. The charts and statistical computations are built using [D3.js](http://D3.js). Both libraries are introduced in the class (Lecture 8.2 for [Leaflet.js](http://Leaflet.js) and Lecture 4 and 5 for D3.js).

**Minimum Viable Product**

With our prototype already being quite advanced, we would obtain our MVP by using our dataset for the plots (instead of simple sinus as we do now). Once implemented, we will be able to select any station from the dataset and explore the evolution of the temperature and precipitations across the time spent by our dataset. 

**Extra ideas**

Here are features to add to our project if time allows:

* More metrics to explore such as sunshine hours  
* Multi-station comparison  
* “Hall of Fame”, compilation of the most extreme days, months, years for each metrics

These features would add depth to our project and give interesting insights to the user.  

**Prototype link** 
https://retrometeo.netlify.app

## Milestone 3 (29th May, 5pm)
**80% of the final grade**

**Website link:**
https://retrometeom3.netlify.app

**ProcessBook link:**
[ProcessBook](ProcessBook.pdf)

**Video link:**
[Video link](https://drive.google.com/file/d/1YWMK-0nhA9MLPntm_JmfVn0RRg7YtWWv/view?usp=share_link)

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

