// Adapted from LayerCake's thresholds() function

export default function thresholds (domain, count) {
    const breaks = [domain[0]];
    const brek = (domain[1] - domain[0]) / count;
    while (breaks[breaks.length - 1] < domain[1]) {
      const node = breaks[breaks.length - 1] + brek;
      breaks.push(node);
    }
    const lastBin = breaks[breaks.length - 1] + brek;
    breaks.push(lastBin);
    return breaks;
  }