module.exports = {
	/**
	 * @desc returns max zoom level based on image dimensions
	 * @param width {number} - image width
	 * @param height {number} - image height
	 * @returns {number} - max zoom level
	 */
	getMaxZoomLevel: function (width, height, maxZoom) {
		var size = Math.max(width, height);

		return Math.min(parseInt( Math.log(size) / Math.log(2), 10) - 8, maxZoom);
	}
}