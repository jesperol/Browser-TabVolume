// Get platform specific interface object.
let platform = chrome ? chrome : browser;

// Setup extension.
document.addEventListener('DOMContentLoaded', function() {
	platform.tabs.query({active: true, currentWindow: true}, function(tabs) {
		let tab = tabs[0]
	    let tabIdStr = tab.id.toString();	

		// Get input fields.
		let buttonStop = document.getElementById('stop');
		let rangeVolume = document.getElementById('range');
		let numberVolume = document.getElementById('number');
		
		buttonStop.addEventListener('click', function() {
			// Set volume to default 100 to disable the system.
			platform.runtime.sendMessage({ id: tab.id, volume: 100 });
			platform.storage.local.remove(tabIdStr);
			window.close();
		});

		function setVolume(vol) {
			platform.runtime.sendMessage({ id: tab.id, volume: vol });
			platform.storage.local.set({ [tabIdStr]: vol });	
		}
		
		rangeVolume.addEventListener('change', function() {
			numberVolume.value = this.value;
			setVolume(this.value);
		});
		
		rangeVolume.addEventListener('input', function() {
			numberVolume.value = this.value;
		});
		
		numberVolume.addEventListener('change', function() {
			rangeVolume.value = this.value;
			setVolume(this.value);
		});
		
		
		// Get volume level from storage
		platform.storage.local.get(tabIdStr, function(items) {
			let volume = items[tabIdStr] ?? 100;
			if (volume != 100) {
				platform.runtime.sendMessage({ id: tab.id, volume: volume });
			}
			rangeVolume.value = numberVolume.value = volume;
		});
	});
});
