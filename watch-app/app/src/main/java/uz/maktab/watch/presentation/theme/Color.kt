package uz.maktab.watch.presentation.theme

import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.Colors

val PrimaryCyan = Color(0xFF00E5FF)
val PrimaryVariant = Color(0xFF00B0FF)
val SecondaryGreen = Color(0xFF00E676)
val ErrorRed = Color(0xFFFF1744)
val DarkBackground = Color(0xFF121212)
val CardBackground = Color(0xFF1E1E1E)

internal val WearColorPalette: Colors = Colors(
    primary = PrimaryCyan,
    primaryVariant = PrimaryVariant,
    secondary = SecondaryGreen,
    error = ErrorRed,
    background = DarkBackground,
    surface = CardBackground,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onError = Color.White
)
