declare interface PluginComponent {
	/**
	 * Name of originating package
	 */
	package: string;
	/**
	 * Name of exported component from package
	 */
	aliasOf?: string;

	/**
	 * If this component is overridden, contains related metadata
	 */
	overriden?: PluginComponent;
}
/**
 * Map of component names to their metadata
 */
declare interface PluginComponents {
	[componentName: string]: PluginComponent;
}
