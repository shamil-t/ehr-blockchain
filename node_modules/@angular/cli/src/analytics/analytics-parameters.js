"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCustomMetric = exports.EventCustomDimension = exports.UserCustomDimension = exports.RequestParameter = void 0;
/**
 * GA built-in request parameters
 * @see https://www.thyngster.com/ga4-measurement-protocol-cheatsheet
 * @see http://go/depot/google3/analytics/container_tag/templates/common/gold/mpv2_schema.js
 */
var RequestParameter;
(function (RequestParameter) {
    RequestParameter["ClientId"] = "cid";
    RequestParameter["DebugView"] = "_dbg";
    RequestParameter["GtmVersion"] = "gtm";
    RequestParameter["Language"] = "ul";
    RequestParameter["NewToSite"] = "_nsi";
    RequestParameter["NonInteraction"] = "ni";
    RequestParameter["PageLocation"] = "dl";
    RequestParameter["PageTitle"] = "dt";
    RequestParameter["ProtocolVersion"] = "v";
    RequestParameter["SessionEngaged"] = "seg";
    RequestParameter["SessionId"] = "sid";
    RequestParameter["SessionNumber"] = "sct";
    RequestParameter["SessionStart"] = "_ss";
    RequestParameter["TrackingId"] = "tid";
    RequestParameter["TrafficType"] = "tt";
    RequestParameter["UserAgentArchitecture"] = "uaa";
    RequestParameter["UserAgentBitness"] = "uab";
    RequestParameter["UserAgentFullVersionList"] = "uafvl";
    RequestParameter["UserAgentMobile"] = "uamb";
    RequestParameter["UserAgentModel"] = "uam";
    RequestParameter["UserAgentPlatform"] = "uap";
    RequestParameter["UserAgentPlatformVersion"] = "uapv";
    RequestParameter["UserId"] = "uid";
})(RequestParameter || (exports.RequestParameter = RequestParameter = {}));
/**
 * User scoped custom dimensions.
 * @notes
 * - User custom dimensions limit is 25.
 * - `up.*` string type.
 * - `upn.*` number type.
 * @see https://support.google.com/analytics/answer/10075209?hl=en
 */
var UserCustomDimension;
(function (UserCustomDimension) {
    UserCustomDimension["UserId"] = "up.ng_user_id";
    UserCustomDimension["OsArchitecture"] = "up.ng_os_architecture";
    UserCustomDimension["NodeVersion"] = "up.ng_node_version";
    UserCustomDimension["NodeMajorVersion"] = "upn.ng_node_major_version";
    UserCustomDimension["AngularCLIVersion"] = "up.ng_cli_version";
    UserCustomDimension["AngularCLIMajorVersion"] = "upn.ng_cli_major_version";
    UserCustomDimension["PackageManager"] = "up.ng_package_manager";
    UserCustomDimension["PackageManagerVersion"] = "up.ng_pkg_manager_version";
    UserCustomDimension["PackageManagerMajorVersion"] = "upn.ng_pkg_manager_major_v";
})(UserCustomDimension || (exports.UserCustomDimension = UserCustomDimension = {}));
/**
 * Event scoped custom dimensions.
 * @notes
 * - Event custom dimensions limit is 50.
 * - `ep.*` string type.
 * - `epn.*` number type.
 * @see https://support.google.com/analytics/answer/10075209?hl=en
 */
var EventCustomDimension;
(function (EventCustomDimension) {
    EventCustomDimension["Command"] = "ep.ng_command";
    EventCustomDimension["SchematicCollectionName"] = "ep.ng_schematic_collection_name";
    EventCustomDimension["SchematicName"] = "ep.ng_schematic_name";
    EventCustomDimension["Standalone"] = "ep.ng_standalone";
    EventCustomDimension["Style"] = "ep.ng_style";
    EventCustomDimension["Routing"] = "ep.ng_routing";
    EventCustomDimension["InlineTemplate"] = "ep.ng_inline_template";
    EventCustomDimension["InlineStyle"] = "ep.ng_inline_style";
    EventCustomDimension["BuilderTarget"] = "ep.ng_builder_target";
    EventCustomDimension["Aot"] = "ep.ng_aot";
    EventCustomDimension["Optimization"] = "ep.ng_optimization";
})(EventCustomDimension || (exports.EventCustomDimension = EventCustomDimension = {}));
/**
 * Event scoped custom mertics.
 * @notes
 * - Event scoped custom mertics limit is 50.
 * - `ep.*` string type.
 * - `epn.*` number type.
 * @see https://support.google.com/analytics/answer/10075209?hl=en
 */
var EventCustomMetric;
(function (EventCustomMetric) {
    EventCustomMetric["AllChunksCount"] = "epn.ng_all_chunks_count";
    EventCustomMetric["LazyChunksCount"] = "epn.ng_lazy_chunks_count";
    EventCustomMetric["InitialChunksCount"] = "epn.ng_initial_chunks_count";
    EventCustomMetric["ChangedChunksCount"] = "epn.ng_changed_chunks_count";
    EventCustomMetric["DurationInMs"] = "epn.ng_duration_ms";
    EventCustomMetric["CssSizeInBytes"] = "epn.ng_css_size_bytes";
    EventCustomMetric["JsSizeInBytes"] = "epn.ng_js_size_bytes";
    EventCustomMetric["NgComponentCount"] = "epn.ng_component_count";
    EventCustomMetric["AllProjectsCount"] = "epn.all_projects_count";
    EventCustomMetric["LibraryProjectsCount"] = "epn.libs_projects_count";
    EventCustomMetric["ApplicationProjectsCount"] = "epn.apps_projects_count";
})(EventCustomMetric || (exports.EventCustomMetric = EventCustomMetric = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl0aWNzLXBhcmFtZXRlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyL2NsaS9zcmMvYW5hbHl0aWNzL2FuYWx5dGljcy1wYXJhbWV0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUlIOzs7O0dBSUc7QUFDSCxJQUFZLGdCQXdCWDtBQXhCRCxXQUFZLGdCQUFnQjtJQUMxQixvQ0FBZ0IsQ0FBQTtJQUNoQixzQ0FBa0IsQ0FBQTtJQUNsQixzQ0FBa0IsQ0FBQTtJQUNsQixtQ0FBZSxDQUFBO0lBQ2Ysc0NBQWtCLENBQUE7SUFDbEIseUNBQXFCLENBQUE7SUFDckIsdUNBQW1CLENBQUE7SUFDbkIsb0NBQWdCLENBQUE7SUFDaEIseUNBQXFCLENBQUE7SUFDckIsMENBQXNCLENBQUE7SUFDdEIscUNBQWlCLENBQUE7SUFDakIseUNBQXFCLENBQUE7SUFDckIsd0NBQW9CLENBQUE7SUFDcEIsc0NBQWtCLENBQUE7SUFDbEIsc0NBQWtCLENBQUE7SUFDbEIsaURBQTZCLENBQUE7SUFDN0IsNENBQXdCLENBQUE7SUFDeEIsc0RBQWtDLENBQUE7SUFDbEMsNENBQXdCLENBQUE7SUFDeEIsMENBQXNCLENBQUE7SUFDdEIsNkNBQXlCLENBQUE7SUFDekIscURBQWlDLENBQUE7SUFDakMsa0NBQWMsQ0FBQTtBQUNoQixDQUFDLEVBeEJXLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBd0IzQjtBQUVEOzs7Ozs7O0dBT0c7QUFDSCxJQUFZLG1CQVVYO0FBVkQsV0FBWSxtQkFBbUI7SUFDN0IsK0NBQXdCLENBQUE7SUFDeEIsK0RBQXdDLENBQUE7SUFDeEMseURBQWtDLENBQUE7SUFDbEMscUVBQThDLENBQUE7SUFDOUMsOERBQXVDLENBQUE7SUFDdkMsMEVBQW1ELENBQUE7SUFDbkQsK0RBQXdDLENBQUE7SUFDeEMsMEVBQW1ELENBQUE7SUFDbkQsZ0ZBQXlELENBQUE7QUFDM0QsQ0FBQyxFQVZXLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBVTlCO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILElBQVksb0JBWVg7QUFaRCxXQUFZLG9CQUFvQjtJQUM5QixpREFBeUIsQ0FBQTtJQUN6QixtRkFBMkQsQ0FBQTtJQUMzRCw4REFBc0MsQ0FBQTtJQUN0Qyx1REFBK0IsQ0FBQTtJQUMvQiw2Q0FBcUIsQ0FBQTtJQUNyQixpREFBeUIsQ0FBQTtJQUN6QixnRUFBd0MsQ0FBQTtJQUN4QywwREFBa0MsQ0FBQTtJQUNsQyw4REFBc0MsQ0FBQTtJQUN0Qyx5Q0FBaUIsQ0FBQTtJQUNqQiwyREFBbUMsQ0FBQTtBQUNyQyxDQUFDLEVBWlcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFZL0I7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsSUFBWSxpQkFZWDtBQVpELFdBQVksaUJBQWlCO0lBQzNCLCtEQUEwQyxDQUFBO0lBQzFDLGlFQUE0QyxDQUFBO0lBQzVDLHVFQUFrRCxDQUFBO0lBQ2xELHVFQUFrRCxDQUFBO0lBQ2xELHdEQUFtQyxDQUFBO0lBQ25DLDZEQUF3QyxDQUFBO0lBQ3hDLDJEQUFzQyxDQUFBO0lBQ3RDLGdFQUEyQyxDQUFBO0lBQzNDLGdFQUEyQyxDQUFBO0lBQzNDLHFFQUFnRCxDQUFBO0lBQ2hELHlFQUFvRCxDQUFBO0FBQ3RELENBQUMsRUFaVyxpQkFBaUIsaUNBQWpCLGlCQUFpQixRQVk1QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgdHlwZSBQcmltaXRpdmVUeXBlcyA9IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW47XG5cbi8qKlxuICogR0EgYnVpbHQtaW4gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gKiBAc2VlIGh0dHBzOi8vd3d3LnRoeW5nc3Rlci5jb20vZ2E0LW1lYXN1cmVtZW50LXByb3RvY29sLWNoZWF0c2hlZXRcbiAqIEBzZWUgaHR0cDovL2dvL2RlcG90L2dvb2dsZTMvYW5hbHl0aWNzL2NvbnRhaW5lcl90YWcvdGVtcGxhdGVzL2NvbW1vbi9nb2xkL21wdjJfc2NoZW1hLmpzXG4gKi9cbmV4cG9ydCBlbnVtIFJlcXVlc3RQYXJhbWV0ZXIge1xuICBDbGllbnRJZCA9ICdjaWQnLFxuICBEZWJ1Z1ZpZXcgPSAnX2RiZycsXG4gIEd0bVZlcnNpb24gPSAnZ3RtJyxcbiAgTGFuZ3VhZ2UgPSAndWwnLFxuICBOZXdUb1NpdGUgPSAnX25zaScsXG4gIE5vbkludGVyYWN0aW9uID0gJ25pJyxcbiAgUGFnZUxvY2F0aW9uID0gJ2RsJyxcbiAgUGFnZVRpdGxlID0gJ2R0JyxcbiAgUHJvdG9jb2xWZXJzaW9uID0gJ3YnLFxuICBTZXNzaW9uRW5nYWdlZCA9ICdzZWcnLFxuICBTZXNzaW9uSWQgPSAnc2lkJyxcbiAgU2Vzc2lvbk51bWJlciA9ICdzY3QnLFxuICBTZXNzaW9uU3RhcnQgPSAnX3NzJyxcbiAgVHJhY2tpbmdJZCA9ICd0aWQnLFxuICBUcmFmZmljVHlwZSA9ICd0dCcsXG4gIFVzZXJBZ2VudEFyY2hpdGVjdHVyZSA9ICd1YWEnLFxuICBVc2VyQWdlbnRCaXRuZXNzID0gJ3VhYicsXG4gIFVzZXJBZ2VudEZ1bGxWZXJzaW9uTGlzdCA9ICd1YWZ2bCcsXG4gIFVzZXJBZ2VudE1vYmlsZSA9ICd1YW1iJyxcbiAgVXNlckFnZW50TW9kZWwgPSAndWFtJyxcbiAgVXNlckFnZW50UGxhdGZvcm0gPSAndWFwJyxcbiAgVXNlckFnZW50UGxhdGZvcm1WZXJzaW9uID0gJ3VhcHYnLFxuICBVc2VySWQgPSAndWlkJyxcbn1cblxuLyoqXG4gKiBVc2VyIHNjb3BlZCBjdXN0b20gZGltZW5zaW9ucy5cbiAqIEBub3Rlc1xuICogLSBVc2VyIGN1c3RvbSBkaW1lbnNpb25zIGxpbWl0IGlzIDI1LlxuICogLSBgdXAuKmAgc3RyaW5nIHR5cGUuXG4gKiAtIGB1cG4uKmAgbnVtYmVyIHR5cGUuXG4gKiBAc2VlIGh0dHBzOi8vc3VwcG9ydC5nb29nbGUuY29tL2FuYWx5dGljcy9hbnN3ZXIvMTAwNzUyMDk/aGw9ZW5cbiAqL1xuZXhwb3J0IGVudW0gVXNlckN1c3RvbURpbWVuc2lvbiB7XG4gIFVzZXJJZCA9ICd1cC5uZ191c2VyX2lkJyxcbiAgT3NBcmNoaXRlY3R1cmUgPSAndXAubmdfb3NfYXJjaGl0ZWN0dXJlJyxcbiAgTm9kZVZlcnNpb24gPSAndXAubmdfbm9kZV92ZXJzaW9uJyxcbiAgTm9kZU1ham9yVmVyc2lvbiA9ICd1cG4ubmdfbm9kZV9tYWpvcl92ZXJzaW9uJyxcbiAgQW5ndWxhckNMSVZlcnNpb24gPSAndXAubmdfY2xpX3ZlcnNpb24nLFxuICBBbmd1bGFyQ0xJTWFqb3JWZXJzaW9uID0gJ3Vwbi5uZ19jbGlfbWFqb3JfdmVyc2lvbicsXG4gIFBhY2thZ2VNYW5hZ2VyID0gJ3VwLm5nX3BhY2thZ2VfbWFuYWdlcicsXG4gIFBhY2thZ2VNYW5hZ2VyVmVyc2lvbiA9ICd1cC5uZ19wa2dfbWFuYWdlcl92ZXJzaW9uJyxcbiAgUGFja2FnZU1hbmFnZXJNYWpvclZlcnNpb24gPSAndXBuLm5nX3BrZ19tYW5hZ2VyX21ham9yX3YnLFxufVxuXG4vKipcbiAqIEV2ZW50IHNjb3BlZCBjdXN0b20gZGltZW5zaW9ucy5cbiAqIEBub3Rlc1xuICogLSBFdmVudCBjdXN0b20gZGltZW5zaW9ucyBsaW1pdCBpcyA1MC5cbiAqIC0gYGVwLipgIHN0cmluZyB0eXBlLlxuICogLSBgZXBuLipgIG51bWJlciB0eXBlLlxuICogQHNlZSBodHRwczovL3N1cHBvcnQuZ29vZ2xlLmNvbS9hbmFseXRpY3MvYW5zd2VyLzEwMDc1MjA5P2hsPWVuXG4gKi9cbmV4cG9ydCBlbnVtIEV2ZW50Q3VzdG9tRGltZW5zaW9uIHtcbiAgQ29tbWFuZCA9ICdlcC5uZ19jb21tYW5kJyxcbiAgU2NoZW1hdGljQ29sbGVjdGlvbk5hbWUgPSAnZXAubmdfc2NoZW1hdGljX2NvbGxlY3Rpb25fbmFtZScsXG4gIFNjaGVtYXRpY05hbWUgPSAnZXAubmdfc2NoZW1hdGljX25hbWUnLFxuICBTdGFuZGFsb25lID0gJ2VwLm5nX3N0YW5kYWxvbmUnLFxuICBTdHlsZSA9ICdlcC5uZ19zdHlsZScsXG4gIFJvdXRpbmcgPSAnZXAubmdfcm91dGluZycsXG4gIElubGluZVRlbXBsYXRlID0gJ2VwLm5nX2lubGluZV90ZW1wbGF0ZScsXG4gIElubGluZVN0eWxlID0gJ2VwLm5nX2lubGluZV9zdHlsZScsXG4gIEJ1aWxkZXJUYXJnZXQgPSAnZXAubmdfYnVpbGRlcl90YXJnZXQnLFxuICBBb3QgPSAnZXAubmdfYW90JyxcbiAgT3B0aW1pemF0aW9uID0gJ2VwLm5nX29wdGltaXphdGlvbicsXG59XG5cbi8qKlxuICogRXZlbnQgc2NvcGVkIGN1c3RvbSBtZXJ0aWNzLlxuICogQG5vdGVzXG4gKiAtIEV2ZW50IHNjb3BlZCBjdXN0b20gbWVydGljcyBsaW1pdCBpcyA1MC5cbiAqIC0gYGVwLipgIHN0cmluZyB0eXBlLlxuICogLSBgZXBuLipgIG51bWJlciB0eXBlLlxuICogQHNlZSBodHRwczovL3N1cHBvcnQuZ29vZ2xlLmNvbS9hbmFseXRpY3MvYW5zd2VyLzEwMDc1MjA5P2hsPWVuXG4gKi9cbmV4cG9ydCBlbnVtIEV2ZW50Q3VzdG9tTWV0cmljIHtcbiAgQWxsQ2h1bmtzQ291bnQgPSAnZXBuLm5nX2FsbF9jaHVua3NfY291bnQnLFxuICBMYXp5Q2h1bmtzQ291bnQgPSAnZXBuLm5nX2xhenlfY2h1bmtzX2NvdW50JyxcbiAgSW5pdGlhbENodW5rc0NvdW50ID0gJ2Vwbi5uZ19pbml0aWFsX2NodW5rc19jb3VudCcsXG4gIENoYW5nZWRDaHVua3NDb3VudCA9ICdlcG4ubmdfY2hhbmdlZF9jaHVua3NfY291bnQnLFxuICBEdXJhdGlvbkluTXMgPSAnZXBuLm5nX2R1cmF0aW9uX21zJyxcbiAgQ3NzU2l6ZUluQnl0ZXMgPSAnZXBuLm5nX2Nzc19zaXplX2J5dGVzJyxcbiAgSnNTaXplSW5CeXRlcyA9ICdlcG4ubmdfanNfc2l6ZV9ieXRlcycsXG4gIE5nQ29tcG9uZW50Q291bnQgPSAnZXBuLm5nX2NvbXBvbmVudF9jb3VudCcsXG4gIEFsbFByb2plY3RzQ291bnQgPSAnZXBuLmFsbF9wcm9qZWN0c19jb3VudCcsXG4gIExpYnJhcnlQcm9qZWN0c0NvdW50ID0gJ2Vwbi5saWJzX3Byb2plY3RzX2NvdW50JyxcbiAgQXBwbGljYXRpb25Qcm9qZWN0c0NvdW50ID0gJ2Vwbi5hcHBzX3Byb2plY3RzX2NvdW50Jyxcbn1cbiJdfQ==