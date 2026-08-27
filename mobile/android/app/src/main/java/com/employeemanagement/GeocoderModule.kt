package com.employeemanagement

import android.location.Address
import android.location.Geocoder
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import java.util.Locale

class GeocoderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DeviceGeocoder"

  @ReactMethod
  fun reverseGeocode(latitude: Double, longitude: Double, promise: Promise) {
    val context = reactApplicationContext

    if (!Geocoder.isPresent()) {
      promise.resolve(null)
      return
    }

    Thread {
      try {
        val geocoder = Geocoder(context, Locale.getDefault())
        @Suppress("DEPRECATION")
        val addresses = geocoder.getFromLocation(latitude, longitude, 1)

        if (addresses.isNullOrEmpty()) {
          promise.resolve(null)
          return@Thread
        }

        val address = addresses[0]
        val result = WritableNativeMap()
        result.putString("address", formatAddress(address))
        result.putString("featureName", address.featureName)
        result.putString("subLocality", address.subLocality)
        result.putString("locality", address.locality)
        result.putString("subAdminArea", address.subAdminArea)
        result.putString("adminArea", address.adminArea)
        result.putString("postalCode", address.postalCode)
        result.putString("thoroughfare", address.thoroughfare)

        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("GEOCODER_ERROR", error.message, error)
      }
    }.start()
  }

  private fun formatAddress(address: Address): String {
    val parts = linkedSetOf<String>()

    listOf(
      address.thoroughfare,
      address.subThoroughfare?.let { "$it ${address.thoroughfare ?: ""}".trim() },
      address.featureName?.takeUnless {
        it.equals(address.locality, true) ||
          it.equals(address.subLocality, true) ||
          it.equals(address.subAdminArea, true)
      },
      address.subLocality,
      address.locality?.takeUnless { it.equals(address.subLocality, true) },
      address.subAdminArea?.takeUnless {
        it.equals(address.subLocality, true) || it.equals(address.locality, true)
      },
      address.adminArea,
      address.postalCode,
    )
      .filterNotNull()
      .map { it.trim() }
      .filter { it.isNotEmpty() }
      .forEach { parts.add(it) }

    return parts.joinToString(", ")
  }
}
