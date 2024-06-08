import Icon from './primitives/Icon';
import type { PhotonOsmHash } from '../lib/BikeHopperClient';

import Building from 'iconoir/icons/building.svg?react';
import Chocolate from 'iconoir/icons/chocolate.svg?react';
import CoffeeCup from 'iconoir/icons/coffee-cup.svg?react';
import Cutlery from 'iconoir/icons/cutlery.svg?react';
import Cycling from 'iconoir/icons/cycling.svg?react';
import Flower from 'iconoir/icons/flower.svg?react';
import GlassHalf from 'iconoir/icons/glass-half.svg?react';
import Golf from 'iconoir/icons/golf.svg?react';
import Gym from 'iconoir/icons/gym.svg?react';
import Home from 'iconoir/icons/home.svg?react';
import Hospital from 'iconoir/icons/hospital.svg?react';
import PharmacyCrossCircle from 'iconoir/icons/pharmacy-cross-circle.svg?react';
import Pin from 'iconoir/icons/map-pin.svg?react';
import PineTree from 'iconoir/icons/pine-tree.svg?react';
import Sandals from 'iconoir/icons/sandals.svg?react';
import Shop from 'iconoir/icons/shop.svg?react';
import StarOutline from 'iconoir/icons/star.svg?react';
import Summit from '../../icons/summit.svg?react';
import Swimming from 'iconoir/icons/swimming.svg?react';
import Trekking from 'iconoir/icons/trekking.svg?react';

/*
 * An icon to represent a place (place prop = GeoJSON result hash from Photon).
 */

type Props = {
  place: GeoJSON.Feature<GeoJSON.Point> | PhotonOsmHash;
  width?: number;
  height?: number;
  className?: string;
  label?: string;
};

export default function PlaceIcon({
  place,
  width,
  height,
  className,
  label,
}: Props) {
  const IconSvg = _getSvgComponentForFeature(place);

  // It seems if we supply an undefined or null width and height prop, it gets
  // interpreted as 0 and makes the icon invisible. So only pass the props if nonempty
  // width and height were passed to us.
  const svgElement =
    width && height ? <IconSvg width={width} height={height} /> : <IconSvg />;

  return (
    <Icon className={className} label={label}>
      {svgElement}
    </Icon>
  );
}

function _getSvgComponentForFeature(
  feature?: GeoJSON.Feature<GeoJSON.Point> | PhotonOsmHash,
) {
  const { osm_key: key, osm_value: value, type } = feature?.properties || {};

  let Klass = Pin;

  if (
    (key === 'boundary' && value === 'national_park') ||
    (key === 'leisure' && ['park', 'nature_reserve'].includes(value))
  ) {
    // park
    Klass = PineTree;
  } else if (
    (key === 'natural' && ['beach', 'shingle'].includes(value)) ||
    (key === 'leisure' && value === 'beach_resort')
  ) {
    // beach
    Klass = Sandals;
  } else if (key === 'natural' && (value === 'peak' || value === 'hill')) {
    Klass = Summit;
  } else if (
    (key === 'natural' && (value === 'rock' || value === 'saddle')) ||
    (key === 'highway' && value === 'footway' && type === 'street') ||
    (key === 'highway' && value === 'path')
  ) {
    // mountain, trail
    Klass = Trekking;
  } else if (key === 'leisure' && value === 'garden') {
    Klass = Flower;
  } else if (key === 'leisure' && value === 'golf_course') {
    Klass = Golf;
  } else if (
    key === 'leisure' &&
    ['swimming_area', 'swimming_pool', 'water_park'].includes(value)
  ) {
    Klass = Swimming;
  } else if (key === 'tourism' && value === 'attraction') {
    Klass = StarOutline;
  } else if (key === 'amenity' && value === 'cafe') {
    Klass = CoffeeCup;
  } else if (
    key === 'amenity' &&
    ['restaurant', 'fast_food', 'food_court'].includes(value)
  ) {
    Klass = Cutlery;
  } else if (
    key === 'amenity' &&
    ['bar', 'biergarten', 'pub'].includes(value)
  ) {
    Klass = GlassHalf;
  } else if (key === 'place' && value === 'house') {
    // note: we can't rely on type === 'house', shops have that
    Klass = Home;
  } else if (key === 'shop' && value === 'chocolate') {
    Klass = Chocolate;
  } else if (
    (key === 'amenity' && value === 'pharmacy') ||
    (key === 'shop' && value === 'chemist')
  ) {
    Klass = PharmacyCrossCircle;
  } else if (key === 'amenity' && value === 'hospital') {
    Klass = Hospital;
  } else if (key === 'highway' && value === 'cycleway') {
    Klass = Cycling;
  } else if (key === 'leisure' && value === 'fitness_centre') {
    Klass = Gym;
  } else if (key === 'shop') {
    // fallback for other types of shops than above
    Klass = Shop;
  } else if (key === 'amenity' && value === 'townhall') {
    Klass = Building; // might not be a great fit for city halls, but best I can do
  }

  return Klass;
}
