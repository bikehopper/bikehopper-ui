import * as React from 'react';
import Icon from './primitives/Icon';

import { ReactComponent as Building } from 'iconoir/icons/building.svg';
import { ReactComponent as Chocolate } from 'iconoir/icons/chocolate.svg';
import { ReactComponent as CoffeeCup } from 'iconoir/icons/coffee-cup.svg';
import { ReactComponent as Cutlery } from 'iconoir/icons/clutery.svg';
import { ReactComponent as Cycling } from 'iconoir/icons/cycling.svg';
import { ReactComponent as Flower } from 'iconoir/icons/flower.svg';
import { ReactComponent as GlassHalf } from 'iconoir/icons/glass-half.svg';
import { ReactComponent as Golf } from 'iconoir/icons/golf.svg';
import { ReactComponent as Gym } from 'iconoir/icons/gym.svg';
import { ReactComponent as Home } from 'iconoir/icons/home.svg';
import { ReactComponent as Hospital } from 'iconoir/icons/hospital.svg';
import { ReactComponent as PharmacyCrossCircle } from 'iconoir/icons/pharmacy-cross-circle.svg';
import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';
import { ReactComponent as PineTree } from 'iconoir/icons/pine-tree.svg';
import { ReactComponent as Sandals } from 'iconoir/icons/sandals.svg';
import { ReactComponent as Shop } from 'iconoir/icons/shop.svg';
import { ReactComponent as StarOutline } from 'iconoir/icons/star.svg';
import { ReactComponent as Summit } from '../../icons/summit.svg';
import { ReactComponent as Swimming } from 'iconoir/icons/swimming.svg';
import { ReactComponent as Trekking } from 'iconoir/icons/trekking.svg';

/*
 * An icon to represent a place (place prop = GeoJSON result hash from Photon).
 */

export default function PlaceIcon({ place, width, height, className, label }) {
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

function _getSvgComponentForFeature(feature) {
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
