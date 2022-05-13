const colors = {
  cool: ['#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
  hot: ['#fdba74', '#fb923c', '#f97316', '#ea580c'],
};

const height = 500;
const width = 1000;
const padding = 60;

async function main() {
  const data = await getData();
  const svg = createSvg();

  const [xScale, yScale] = createScales(data);
  const [xScaleBand, yScaleBand] = createScaleBands(data);

  createAxes(svg, [xScale, yScale]);
  createLegend();

  const tooltip = createTooltip();

  svg
    .selectAll('rect')
    .data(data.monthlyVariance)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-month', d => d.month - 1)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => data.baseTemperature + d.variance)
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month - 1))
    .attr('width', xScaleBand.bandwidth())
    .attr('height', yScaleBand.bandwidth())
    .attr('fill', d => {
      const isCool = d.variance < 0;
      const idx = Math.min(Math.round(Math.abs(d.variance)), 3);
      return isCool ? colors.cool[idx] : colors.hot[idx];
    })
    .on('mouseenter', function (evt, d) {
      const { x, y } = evt;
      const temperature = data.baseTemperature + d.variance;
      const text = `
        ${d.year} - ${getMonthName(d.month)}
        ${Number(temperature).toFixed(2)}°C
        ${Number(d.variance).toFixed(2)}°C
      `;

      tooltip
        .style('opacity', 1)
        .style('top', `${y - 16}px`)
        .style('left', `${x + 16}px`)
        .text(text)
        .attr('data-year', d.year);

      d3.select(this).style('stroke', 'black');
    })
    .on('mouseleave', function () {
      tooltip.style('opacity', 0);

      d3.select(this).style('stroke', null);
    });
}

async function getData() {
  const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
  const resp = await fetch(url);
  return await resp.json();
}

function createSvg() {
  return d3.select('body').append('svg').attr('height', height).attr('width', width);
}

function createScales(data) {
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data.monthlyVariance, d => d.year))
    .range([padding, width - padding]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data.monthlyVariance, d => d.month).reverse())
    .range([height - padding, padding]);

  return [xScale, yScale];
}

function createScaleBands(data) {
  data = data.monthlyVariance;

  const xScaleBand = d3
    .scaleBand()
    .domain(data.map(d => d.year))
    .range([padding, width]);

  const yScaleBand = d3
    .scaleBand()
    .domain(data.map(d => d.month))
    .range([height, padding]);

  return [xScaleBand, yScaleBand];
}

function createAxes(svg, scales) {
  const [xScale, yScale] = scales;

  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${height - padding})`)
    .call(d3.axisBottom(xScale).tickFormat(d => `${d}`));

  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${padding}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(getMonthName));
}

function getMonthName(month) {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString('default', { month: 'long' });
}

function createLegend() {
  const legend = d3.select('body').append('svg').attr('id', 'legend').attr('height', 200);

  legend
    .selectAll('rect')
    .data([...colors.cool, ...colors.hot])
    .enter()
    .append('rect')
    .attr('x', 20)
    .attr('y', (_, i) => 20 + i * 20)
    .attr('height', 7)
    .attr('width', 7)
    .attr('fill', d => d);

  legend
    .selectAll('text')
    .data(['very cool', 'cool', 'less cool', 'least cool', 'least hot', 'less hot', 'hot', 'very hot'])
    .enter()
    .append('text')
    .attr('x', 30)
    .attr('y', (_, i) => 27 + i * 20)
    .text(d => d);
}

function createTooltip() {
  return d3.select('body').append('div').attr('id', 'tooltip').style('opacity', 0).style('position', 'fixed');
}

main();
