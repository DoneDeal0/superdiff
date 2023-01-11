// src/model.ts
var STATUS = {
  ADDED: "added",
  EQUAL: "equal",
  MOVED: "moved",
  DELETED: "deleted",
  UPDATED: "updated"
};

// src/utils.ts
function isEqual(a, b, options = { discardArrayOrder: false }) {
  if (typeof a !== typeof b)
    return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    if (options.discardArrayOrder) {
      return a.every(
        (v) => b.some((nextV) => JSON.stringify(nextV) === JSON.stringify(v))
      );
    }
    return a.every((v, i) => JSON.stringify(v) === JSON.stringify(b[i]));
  }
  if (typeof a === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}
function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// src/object-diff.ts
function getObjectStatus(diff) {
  return diff.some((property) => property.status !== STATUS.EQUAL) ? STATUS.UPDATED : STATUS.EQUAL;
}
function formatSingleObjectDiff(data, status) {
  if (!data) {
    return {
      type: "object",
      status: STATUS.isEqual,
      diff: []
    };
  }
  const diff = [];
  Object.entries(data).forEach(([property, value]) => {
    if (isObject(value)) {
      const subPropertiesDiff = [];
      Object.entries(value).forEach(([subProperty, subValue]) => {
        subPropertiesDiff.push({
          name: subProperty,
          previousValue: status === STATUS.ADDED ? void 0 : subValue,
          currentValue: status === STATUS.ADDED ? subValue : void 0,
          status
        });
      });
      return diff.push({
        property,
        previousValue: status === STATUS.ADDED ? void 0 : data[property],
        currentValue: status === STATUS.ADDED ? value : void 0,
        status,
        subPropertiesDiff
      });
    }
    return diff.push({
      property,
      previousValue: status === STATUS.ADDED ? void 0 : data[property],
      currentValue: status === STATUS.ADDED ? value : void 0,
      status
    });
  });
  return {
    type: "object",
    status,
    diff
  };
}
function getPreviousMatch(previousValue, nextSubProperty, options) {
  if (!previousValue) {
    return void 0;
  }
  const previousMatch = Object.entries(previousValue).find(
    ([subPreviousKey]) => isEqual(subPreviousKey, nextSubProperty, options)
  );
  return previousMatch ? previousMatch[1] : void 0;
}
function getValueStatus(previousValue, nextValue, options) {
  if (isEqual(previousValue, nextValue, options)) {
    return STATUS.EQUAL;
  }
  return STATUS.UPDATED;
}
function getPropertyStatus(subPropertiesDiff) {
  return subPropertiesDiff.some((property) => property.status !== STATUS.EQUAL) ? STATUS.UPDATED : STATUS.EQUAL;
}
function getDeletedProperties(previousValue, nextValue) {
  if (!previousValue)
    return void 0;
  const prevKeys = Object.keys(previousValue);
  const nextKeys = Object.keys(nextValue);
  const deletedKeys = prevKeys.filter((prevKey) => !nextKeys.includes(prevKey));
  if (deletedKeys.length > 0) {
    return deletedKeys.map((deletedKey) => ({
      property: deletedKey,
      value: previousValue[deletedKey]
    }));
  }
  return void 0;
}
function getSubPropertiesDiff(previousValue, nextValue, options) {
  const subPropertiesDiff = [];
  let subDiff;
  const deletedMainSubProperties = getDeletedProperties(
    previousValue,
    nextValue
  );
  if (deletedMainSubProperties) {
    deletedMainSubProperties.forEach((deletedProperty) => {
      subPropertiesDiff.push({
        name: deletedProperty.property,
        previousValue: deletedProperty.value,
        currentValue: void 0,
        status: STATUS.DELETED
      });
    });
  }
  Object.entries(nextValue).forEach(([nextSubProperty, nextSubValue]) => {
    const previousMatch = getPreviousMatch(
      previousValue,
      nextSubProperty,
      options
    );
    if (!!!previousMatch && !!nextSubProperty) {
      return subPropertiesDiff.push({
        name: nextSubProperty,
        previousValue: void 0,
        currentValue: nextSubValue,
        status: STATUS.ADDED
      });
    }
    if (isObject(nextSubValue)) {
      const data = getSubPropertiesDiff(
        previousMatch,
        nextSubValue,
        options
      );
      if (data && data.length > 0) {
        subDiff = data;
      }
    }
    if (previousMatch) {
      subPropertiesDiff.push({
        name: nextSubProperty,
        previousValue: previousMatch,
        currentValue: nextSubValue,
        status: getValueStatus(previousMatch, nextSubValue, options),
        ...!!subDiff && { subDiff }
      });
    }
  });
  return subPropertiesDiff;
}
function getObjectDiff(prevData, nextData, options) {
  if (!prevData && !nextData) {
    return {
      type: "object",
      status: STATUS.EQUAL,
      diff: []
    };
  }
  if (!prevData) {
    return formatSingleObjectDiff(nextData, STATUS.ADDED);
  }
  if (!nextData) {
    return formatSingleObjectDiff(prevData, STATUS.DELETED);
  }
  const diff = [];
  Object.entries(nextData).forEach(([nextProperty, nextValue]) => {
    const previousValue = prevData[nextProperty];
    if (!!!previousValue) {
      return diff.push({
        property: nextProperty,
        previousValue: void 0,
        currentValue: nextValue,
        status: STATUS.ADDED
      });
    }
    if (isObject(nextValue)) {
      const subPropertiesDiff = getSubPropertiesDiff(
        previousValue,
        nextValue,
        options
      );
      return diff.push({
        property: nextProperty,
        previousValue,
        currentValue: nextValue,
        status: getPropertyStatus(subPropertiesDiff),
        subPropertiesDiff
      });
    }
    return diff.push({
      property: nextProperty,
      previousValue,
      currentValue: nextValue,
      status: getValueStatus(previousValue, nextValue, options)
    });
  });
  const deletedProperties = getDeletedProperties(prevData, nextData);
  if (deletedProperties) {
    deletedProperties.forEach((deletedProperty) => {
      diff.push({
        property: deletedProperty.property,
        previousValue: deletedProperty.value,
        currentValue: void 0,
        status: STATUS.DELETED
      });
    });
  }
  return {
    type: "object",
    status: getObjectStatus(diff),
    diff
  };
}

// src/list-diff.ts
function formatSingleListDiff(listData, status) {
  return {
    type: "list",
    status,
    diff: listData.map((data, i) => ({
      value: data,
      prevIndex: status === STATUS.ADDED ? null : i,
      newIndex: status === STATUS.ADDED ? i : null,
      indexDiff: null,
      status
    }))
  };
}
function getListStatus(listDiff) {
  return listDiff.some((value) => value.status !== STATUS.EQUAL) ? STATUS.UPDATED : STATUS.EQUAL;
}
var getListDiff = (prevList, nextList) => {
  if (!prevList && !nextList) {
    return {
      type: "list",
      status: STATUS.EQUAL,
      diff: []
    };
  }
  if (!prevList) {
    return formatSingleListDiff(nextList, STATUS.ADDED);
  }
  if (!nextList) {
    return formatSingleListDiff(prevList, STATUS.DELETED);
  }
  const diff = [];
  nextList.forEach((nextValue, i) => {
    const prevIndex = prevList.findIndex(
      (prevValue) => isEqual(prevValue, nextValue)
    );
    const indexDiff = prevIndex === -1 ? null : i - prevIndex;
    if (indexDiff === 0) {
      return diff.push({
        value: nextValue,
        prevIndex,
        newIndex: i,
        indexDiff,
        status: STATUS.EQUAL
      });
    }
    if (prevIndex === -1) {
      return diff.push({
        value: nextValue,
        prevIndex: null,
        newIndex: i,
        indexDiff,
        status: STATUS.ADDED
      });
    }
    return diff.push({
      value: nextValue,
      prevIndex,
      newIndex: i,
      indexDiff,
      status: STATUS.MOVED
    });
  });
  prevList.forEach((prevValue, i) => {
    if (!nextList.some((nextValue) => isEqual(nextValue, prevValue))) {
      return diff.splice(i, 0, {
        value: prevValue,
        prevIndex: i,
        newIndex: null,
        indexDiff: null,
        status: STATUS.DELETED
      });
    }
  });
  return {
    type: "list",
    status: getListStatus(diff),
    diff
  };
};

export { getListDiff, getObjectDiff, isEqual, isObject };
