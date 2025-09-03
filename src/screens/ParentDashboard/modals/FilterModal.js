import { Slider } from "@miblanchard/react-native-slider";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { Button, Switch, Text } from "react-native-paper";

// Add type checking utilities
const isValidArray = (arr) => Array.isArray(arr) && arr !== null;
const isValidNumber = (num) => typeof num === "number" && !isNaN(num);

const defaultFilters = {
  availability: { availableNow: false, days: [] },
  location: { distance: 10, location: "" },
  rate: { min: 0, max: 1000 },
  experience: { min: 0, max: 30 },
  certifications: [],
  rating: 0,
};

const FilterModal = ({
  visible,
  onClose,
  filters = defaultFilters,
  onApplyFilters,
}) => {
  // Initialize with safe defaults
  const [localFilters, setLocalFilters] = useState(() => {
    const safeFilters = filters || defaultFilters;
    return {
      ...defaultFilters,
      ...safeFilters,
      availability: {
        availableNow: Boolean(safeFilters?.availability?.availableNow),
        days: isValidArray(safeFilters?.availability?.days)
          ? [...safeFilters.availability.days]
          : [],
      },
      location: {
        distance: isValidNumber(safeFilters?.location?.distance)
          ? safeFilters.location.distance
          : 10,
        location: safeFilters?.location?.location || "",
      },
      rate: {
        min: isValidNumber(safeFilters?.rate?.min) ? safeFilters.rate.min : 0,
        max: isValidNumber(safeFilters?.rate?.max)
          ? safeFilters.rate.max
          : 1000,
      },
      experience: {
        min: isValidNumber(safeFilters?.experience?.min)
          ? safeFilters.experience.min
          : 0,
        max: isValidNumber(safeFilters?.experience?.max)
          ? safeFilters.experience.max
          : 30,
      },
      certifications: isValidArray(safeFilters?.certifications)
        ? [...safeFilters.certifications]
        : [],
      rating: isValidNumber(safeFilters?.rating) ? safeFilters.rating : 0,
    };
  });

  // Safe value getter function
  const getSafeValue = (value, defaultValue) => {
    if (value === undefined || value === null) return defaultValue;
    if (Array.isArray(defaultValue))
      return isValidArray(value) ? [...value] : [...defaultValue];
    if (typeof defaultValue === "number")
      return isValidNumber(value) ? value : defaultValue;
    if (typeof defaultValue === "boolean") return Boolean(value);
    return value || defaultValue;
  };

  const handleApply = () => {
    try {
      const sanitizedFilters = {
        ...defaultFilters,
        ...localFilters,
        availability: {
          availableNow: getSafeValue(
            localFilters?.availability?.availableNow,
            false
          ),
          days: getSafeValue(localFilters?.availability?.days, []),
        },
        location: {
          distance: getSafeValue(localFilters?.location?.distance, 10),
          location: getSafeValue(localFilters?.location?.location, ""),
        },
        rate: {
          min: getSafeValue(localFilters?.rate?.min, 0),
          max: getSafeValue(localFilters?.rate?.max, 1000),
        },
        experience: {
          min: getSafeValue(localFilters?.experience?.min, 0),
          max: getSafeValue(localFilters?.experience?.max, 30),
        },
        certifications: getSafeValue(localFilters?.certifications, []),
        rating: getSafeValue(localFilters?.rating, 0),
      };
      onApplyFilters(sanitizedFilters);
      onClose();
    } catch (error) {
      console.warn("Filter apply error:", error);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.filtersContainer}>
            {/* Availability Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <Switch
                value={getSafeValue(
                  localFilters?.availability?.availableNow,
                  false
                )}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    availability: {
                      ...(prev.availability || {}),
                      availableNow: value,
                    },
                  }))
                }
              />
            </View>

            {/* Rate Range Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Rate Range</Text>
              <Slider
                value={[
                  getSafeValue(localFilters?.rate?.min, 0),
                  getSafeValue(localFilters?.rate?.max, 1000),
                ]}
                onValueChange={([min, max]) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    rate: { min, max },
                  }))
                }
                minimumValue={0}
                maximumValue={1000}
                step={50}
              />
            </View>

            {/* Experience Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <Slider
                value={getSafeValue(localFilters?.experience?.min, 0)}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    experience: { ...(prev.experience || {}), min: value[0] },
                  }))
                }
                minimumValue={0}
                maximumValue={30}
                step={1}
              />
            </View>

            {/* Rating Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <Slider
                value={getSafeValue(localFilters?.rating, 0)}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    rating: value[0],
                  }))
                }
                minimumValue={0}
                maximumValue={5}
                step={0.5}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button mode="outlined" onPress={onClose} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              style={styles.button}
            >
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  filtersContainer: {
    flexGrow: 1,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default FilterModal;
