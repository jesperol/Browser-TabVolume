// Get platform specific interface object.
let platform = chrome ? chrome : browser;

// Setup extension.
document.addEventListener('DOMContentLoaded', function() {
	platform.tabs.query({active: true, currentWindow: true}, function(tabs) {
		let tab = tabs[0]
	    let tabIdStr = tab.id.toString();	

		// Get input fields.
		let input = document.getElementById('interface').children;
		// Add input change event. The 'input' event would allow us to update number field whilst dragging
		for (let i = 0; i < input.length; i++) {
			input[i].addEventListener('change', function() {
				// Set value to other input field.
				for (let j = 0; j < input.length; j++) {
					if (input[j] === this) {
						continue;
					}
					input[j].value = this.value;
				}
				
				// Set volume level of tab.
				platform.runtime.sendMessage({ id: tab.id, volume: this.value });
				// Store value level.
				platform.storage.local.set({ [tabIdStr]: this.value });
			});
		}
		// Add button click event.
		document.getElementById('stop').addEventListener('click', function() {
			// Set volume to default 100 to disable the system.
			platform.runtime.sendMessage({ id: tab.id, volume: 100 });
			// Remove value level
			platform.storage.local.remove(tabIdStr);
			// Exit the window.
			window.close();
		});
		
		// Get volume level from storage.
		platform.storage.local.get(tabIdStr, function(items) {
			// Apply volume level.
			let volume = items[tabIdStr];
			if (volume) {
				platform.runtime.sendMessage({ id: tab.id, volume: volume });
			}
			// If no volume level given set default of 100.
			else {
				volume = 100;
			}
			
			// Apply volume to interface.
			for (let k = 0; k < input.length; k++) {
				input[k].value = volume;
			}
		});
	});
});
