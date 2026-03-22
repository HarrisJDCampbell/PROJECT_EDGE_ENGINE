/**
 * VisBets Utility Functions
 * Formatting and helper functions
 */

/**
 * Format edge value with sign
 */
export function formatEdge(edge: number): string {
  const sign = edge > 0 ? '+' : '';
  return `${sign}${edge.toFixed(1)}`;
}

/**
 * Format stat value (1 decimal place)
 */
export function formatStat(value: number): string {
  return value.toFixed(1);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format game time (relative or absolute)
 */
export function formatGameTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 0) {
    return 'Live';
  } else if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m`;
  } else if (hours < 24) {
    return formatTime(d);
  } else {
    return formatDate(d);
  }
}

/**
 * Get player initials from name
 */
export function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Calculate mean of array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate coefficient of variation (CV)
 */
export function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  return standardDeviation(values) / avg;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get confidence label from score
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 75) return 'High';
  if (confidence >= 50) return 'Medium';
  return 'Low';
}

/**
 * Get minutes risk label from std dev
 */
export function getMinutesRiskLabel(stdDev: number): 'Low' | 'Medium' | 'High' {
  if (stdDev > 8) return 'High';
  if (stdDev > 4) return 'Medium';
  return 'Low';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep utility (for testing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
