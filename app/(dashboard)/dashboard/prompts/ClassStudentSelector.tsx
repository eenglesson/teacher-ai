'use client';
import type React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getAllStudents } from '@/lib/client.student';
import { Tables } from '@/database.types';
import { formatName } from '@/app/utils/formatName';

// Define types for our data structure
type Student = {
  id: string;
  name: string;
  interests: string | null;
  learning_difficulties: string | null;
  school_year: string | null;
};

type Class = {
  id: string;
  name: string;
  students: Student[];
};

interface ClassStudentSelectorProps {
  setSelectedStudents: (
    students: {
      id: string;
      interests: string | null;
      learning_difficulties: string | null;
      school_year: string | null;
    }[]
  ) => void;
}

export default function ClassStudentSelector({
  setSelectedStudents,
}: ClassStudentSelectorProps) {
  // State for expanded classes
  const [expandedClasses, setExpandedClasses] = useState<
    Record<string, boolean>
  >({});

  // State for selected items (both classes and students)
  const [selectedItems, setSelectedItems] = useState<{
    classes: Record<string, boolean>;
    students: Record<string, boolean>;
  }>({
    classes: {},
    students: {},
  });

  const [students, setStudents] = useState<Tables<'students'>[]>([]);

  // Fetch students from the database
  useEffect(() => {
    async function fetchStudents() {
      try {
        const data = await getAllStudents();
        setStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    }

    fetchStudents();
  }, []);

  // Compute classes from fetched students by grouping them by school_year
  const classes = useMemo(() => {
    const grouped = students.reduce((acc, student) => {
      const schoolYear = student.school_year || 'Unknown';
      if (!acc[schoolYear]) {
        acc[schoolYear] = {
          id: schoolYear,
          name: `Class ${schoolYear.toLocaleUpperCase()}`,
          students: [],
        };
      }
      acc[schoolYear].students.push({
        id: student.id,
        name: student.full_name || 'Unnamed',
        interests: student.interests,
        learning_difficulties: student.learning_difficulties,
        school_year: student.school_year,
      });
      return acc;
    }, {} as Record<string, Class>);
    return Object.values(grouped);
  }, [students]);

  // Update parent component with selected student data
  useEffect(() => {
    const selectedStudentData = classes
      .flatMap((classItem) => classItem.students)
      .filter((student) => selectedItems.students[student.id])
      .map(({ id, interests, learning_difficulties, school_year }) => ({
        id,
        interests,
        learning_difficulties,
        school_year,
      }));
    setSelectedStudents(selectedStudentData);
  }, [selectedItems.students, classes, setSelectedStudents]);

  // Toggle class expansion
  const toggleClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  // Toggle class selection
  const toggleClassSelection = (classItem: Class, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const isCurrentlySelected = selectedItems.classes[classItem.id];
    const newClassSelection = {
      ...selectedItems.classes,
      [classItem.id]: !isCurrentlySelected,
    };

    const newStudentSelection = { ...selectedItems.students };
    classItem.students.forEach((student) => {
      newStudentSelection[student.id] = !isCurrentlySelected;
    });

    setSelectedItems({
      classes: newClassSelection,
      students: newStudentSelection,
    });
  };

  // Toggle student selection
  const toggleStudentSelection = (
    studentId: string,
    classId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    const newStudentSelection = {
      ...selectedItems.students,
      [studentId]: !selectedItems.students[studentId],
    };

    const classStudents = classes.find((c) => c.id === classId)?.students || [];
    const allStudentsSelected = classStudents.every(
      (student) => newStudentSelection[student.id]
    );

    setSelectedItems({
      classes: {
        ...selectedItems.classes,
        [classId]: allStudentsSelected,
      },
      students: newStudentSelection,
    });
  };

  // Get total selected students count
  const getTotalSelectedStudents = () => {
    return Object.values(selectedItems.students).filter(Boolean).length;
  };

  // Get selected student count for a class
  const getSelectedStudentCount = (classItem: Class) => {
    return classItem.students.filter(
      (student) => selectedItems.students[student.id]
    ).length;
  };

  // Clear all selections and collapse all classes
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems({
      classes: {},
      students: {},
    });
    setExpandedClasses({});
  };

  return (
    <div className=''>
      <div className=''>
        <div>
          <Popover>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    id='class-selector'
                    variant='outline'
                    className='text-muted-foreground rounded-full w-fit'
                  >
                    <Users className='h-4 w-4' />
                    <span className='font-medium'>
                      {getTotalSelectedStudents() > 0
                        ? getTotalSelectedStudents()
                        : 0}
                    </span>
                    <Separator orientation='vertical' className='h-4 mx-0.5' />
                    <ChevronDown className='h-4 w-4 text-muted-foreground' />
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>

              <TooltipContent
                sideOffset={4}
                className='dark:bg-popover bg-accent px-3 py-1 text-sm'
              >
                <p className='text-foreground'>Select students</p>
              </TooltipContent>
            </Tooltip>

            <PopoverContent className='w-64 p-0 bg-popover text-popover-foreground border-border'>
              <ScrollArea className='h-64 px-2'>
                <div className='flex items-center w-full justify-between p-2 gap-2'>
                  <h3 className='text-body font-medium text-foreground'>
                    Select Students
                  </h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-muted-foreground'
                    onClick={clearAll}
                  >
                    Clear All
                  </Button>
                </div>
                <div className='p-1'>
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className='rounded-sm mb-1 last:mb-0'
                    >
                      <div
                        className={cn(
                          'flex items-center px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-default rounded-sm',
                          selectedItems.classes[classItem.id] && 'bg-accent/50'
                        )}
                        onClick={(e) => toggleClass(classItem.id, e)}
                      >
                        <Checkbox
                          id={`class-${classItem.id}`}
                          checked={!!selectedItems.classes[classItem.id]}
                          onCheckedChange={() =>
                            toggleClassSelection(classItem)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className='mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                        />
                        <div
                          className='mr-2'
                          onClick={(e) => toggleClass(classItem.id, e)}
                        >
                          {expandedClasses[classItem.id] ? (
                            <ChevronDown className='h-4 w-4 text-muted-foreground' />
                          ) : (
                            <ChevronRight className='h-4 w-4 text-muted-foreground' />
                          )}
                        </div>
                        <span className='font-medium text-sm flex-1 text-foreground'>
                          {classItem.name}
                        </span>
                        <Badge
                          variant={
                            getSelectedStudentCount(classItem) > 0
                              ? 'default'
                              : 'outline'
                          }
                          className='ml-2 text-xs'
                        >
                          {getSelectedStudentCount(classItem)}/
                          {classItem.students.length}
                        </Badge>
                      </div>
                      {expandedClasses[classItem.id] && (
                        <div className='pl-9 pr-2 space-y-1 mt-1 mb-2'>
                          {classItem.students.map((student) => (
                            <div
                              key={student.id}
                              className={cn(
                                'flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-default rounded-sm',
                                selectedItems.students[student.id] &&
                                  'bg-accent/30'
                              )}
                              onClick={() =>
                                toggleStudentSelection(student.id, classItem.id)
                              }
                            >
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={!!selectedItems.students[student.id]}
                                onCheckedChange={() =>
                                  toggleStudentSelection(
                                    student.id,
                                    classItem.id
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                className='mr-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'
                              />
                              <div className='font-medium text-sm text-foreground'>
                                {formatName(student.name)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
