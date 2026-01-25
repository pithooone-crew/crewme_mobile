import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MapView = ({ children, style, ...props }: any) => {
  return <View style={style}>{children}</View>;
};

const Marker = ({ children, ...props }: any) => null;
const Circle = (props: any) => null;
const Polygon = (props: any) => null;
const PROVIDER_GOOGLE = null;

export { MapView, Marker, Circle, Polygon, PROVIDER_GOOGLE };
export const isMapAvailable = false;
